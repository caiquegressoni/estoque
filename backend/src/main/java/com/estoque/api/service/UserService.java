package com.estoque.api.service;

import com.estoque.api.dto.CreateUserRequestDTO;
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

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    public UserResponseDTO createUser(CreateUserRequestDTO data) {
        UserModel loggedUser = getAuthenticatedUser();
        if (loggedUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Acesso negado: apenas administradores podem cadastrar novos colaboradores.");
        }

        if (userRepository.findByEmail(data.email()).isPresent()) {
            throw new RuntimeException("Já existe um usuário cadastrado com este e-mail.");
        }

        String encryptedPassword = passwordEncoder.encode(data.password());
        UserRole role = data.role() != null ? data.role() : UserRole.USER;

        UserModel newUser = new UserModel(
                data.fullName(),
                data.email(),
                encryptedPassword,
                role,
                loggedUser.getTenant()
        );

        userRepository.save(newUser);
        return new UserResponseDTO(newUser);
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
