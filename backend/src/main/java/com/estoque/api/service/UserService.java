package com.estoque.api.service;

import com.estoque.api.dto.CreateUserRequestDTO;
import com.estoque.api.dto.CreateUserResponseDTO;
import com.estoque.api.dto.UserResponseDTO;
import com.estoque.api.model.UserModel;
import com.estoque.api.model.enums.UserRole;
import com.estoque.api.repository.StockMovementRepository;
import com.estoque.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private Auth0ManagementClient auth0ManagementClient;

    private UserModel getAuthenticatedUser() {
        return (UserModel) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public List<UserResponseDTO> listUsers() {
        UserModel loggedUser = getAuthenticatedUser();
        if (loggedUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Acesso negado: apenas administradores podem visualizar os membros da equipe.");
        }
        return userRepository.findByTenant(loggedUser.getTenant())
                .stream()
                .map(UserResponseDTO::new)
                .toList();
    }

    public UserResponseDTO getCurrentUser() {
        return new UserResponseDTO(getAuthenticatedUser());
    }

    public CreateUserResponseDTO createUser(CreateUserRequestDTO data) {
        UserModel loggedUser = getAuthenticatedUser();
        if (loggedUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Acesso negado: apenas administradores podem cadastrar novos colaboradores.");
        }

        if (data.fullName() == null || data.fullName().isBlank()) {
            throw new IllegalArgumentException("O nome completo é obrigatório.");
        }
        if (data.email() == null || !EMAIL_PATTERN.matcher(data.email().trim()).matches()) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }

        String normalizedEmail = data.email().trim().toLowerCase(Locale.ROOT);
        UserModel localUser = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (localUser != null) {
            boolean sameTenant = localUser.getTenant().getId().equals(loggedUser.getTenant().getId());
            boolean pendingAuth0Link = localUser.getAuth0Subject() == null;
            if (!sameTenant || localUser.getRole() != UserRole.USER || !pendingAuth0Link) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Já existe um usuário cadastrado com este e-mail no Estoque."
                );
            }
        } else {
            String encryptedPassword = passwordEncoder.encode("AUTH0_ONLY_" + UUID.randomUUID());
            localUser = new UserModel(
                    data.fullName().trim(),
                    normalizedEmail,
                    encryptedPassword,
                    UserRole.USER,
                    loggedUser.getTenant()
            );
            if (localUser.getUsername() != null && userRepository.existsByUsername(localUser.getUsername())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Já existe um colaborador com este nome de usuário. Ajuste o nome completo para diferenciá-lo."
                );
            }
            localUser = userRepository.saveAndFlush(localUser);
        }

        return provisionAuth0Identity(localUser);
    }

    public CreateUserResponseDTO retryAuth0Provisioning(Long id) {
        UserModel loggedUser = getAuthenticatedUser();
        if (loggedUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Acesso negado: apenas administradores podem concluir cadastros de colaboradores.");
        }

        UserModel targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
        if (!targetUser.getTenant().getId().equals(loggedUser.getTenant().getId())) {
            throw new AccessDeniedException("Acesso negado: o colaborador pertence a outra empresa.");
        }
        if (targetUser.getRole() != UserRole.USER || targetUser.getAuth0Subject() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este usuário não possui um vínculo Auth0 pendente.");
        }

        return provisionAuth0Identity(targetUser);
    }

    private CreateUserResponseDTO provisionAuth0Identity(UserModel localUser) {
        Auth0ManagementClient.Auth0Identity identity = auth0ManagementClient.createOrFindUser(
                localUser.getFullName(),
                localUser.getEmail()
        );

        if (localUser.getAuth0Subject() != null && !localUser.getAuth0Subject().equals(identity.subject())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "O usuário Auth0 encontrado não corresponde ao vínculo já registrado no Estoque."
            );
        }

        if (localUser.getAuth0Subject() == null) {
            localUser.setAuth0Subject(identity.subject());
            localUser = userRepository.saveAndFlush(localUser);
        }

        boolean passwordSetupRequired = !identity.emailVerified();
        boolean passwordSetupEmailSent = passwordSetupRequired
                && auth0ManagementClient.sendPasswordSetupEmail(localUser.getEmail());
        return new CreateUserResponseDTO(
                new UserResponseDTO(localUser),
                passwordSetupRequired,
                passwordSetupEmailSent
        );
    }

    public void deleteUser(Long id) {
        UserModel loggedUser = getAuthenticatedUser();
        if (loggedUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Acesso negado: apenas administradores podem excluir colaboradores.");
        }

        UserModel targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (!targetUser.getTenant().getId().equals(loggedUser.getTenant().getId())) {
            throw new AccessDeniedException("Acesso negado: você não tem permissão para remover usuários de outra empresa.");
        }

        if (targetUser.getId().equals(loggedUser.getId())) {
            throw new RuntimeException("Ação não permitida: você não pode excluir a sua própria conta de administrador.");
        }

        if (stockMovementRepository.existsByUser(targetUser)) {
            throw new RuntimeException("Não é possível excluir este usuário pois ele possui histórico de movimentações no estoque (auditoria operacional).");
        }

        userRepository.delete(targetUser);
    }
}
