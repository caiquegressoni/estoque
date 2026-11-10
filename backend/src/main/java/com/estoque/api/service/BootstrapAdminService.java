package com.estoque.api.service;

import com.estoque.api.model.Tenant;
import com.estoque.api.model.UserModel;
import com.estoque.api.model.enums.UserRole;
import com.estoque.api.repository.TenantRepository;
import com.estoque.api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class BootstrapAdminService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public BootstrapAdminService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void provisionFirstAdmin(String tenantName, String fullName, String email, String password) {
        String normalizedTenantName = tenantName.trim();
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        var existingUser = userRepository.findByEmail(normalizedEmail);
        if (existingUser.isPresent()) {
            UserModel user = existingUser.get();
            if (user.getRole() == UserRole.ADMIN
                    && user.getTenant().getName().equals(normalizedTenantName)) {
                return;
            }
            throw new IllegalStateException("O e-mail informado já pertence a outro usuário.");
        }

        if (userRepository.count() > 0) {
            throw new IllegalStateException(
                    "O bootstrap só pode criar o primeiro administrador de uma instalação sem usuários."
            );
        }

        Tenant tenant = tenantRepository.findByName(normalizedTenantName)
                .orElseGet(() -> {
                    Tenant newTenant = new Tenant();
                    newTenant.setName(normalizedTenantName);
                    return tenantRepository.save(newTenant);
                });

        UserModel admin = new UserModel(
                fullName.trim(),
                normalizedEmail,
                passwordEncoder.encode(password),
                UserRole.ADMIN,
                tenant
        );
        userRepository.save(admin);
    }
}
