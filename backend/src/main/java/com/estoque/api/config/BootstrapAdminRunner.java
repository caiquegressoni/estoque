package com.estoque.api.config;

import com.estoque.api.service.BootstrapAdminService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class BootstrapAdminRunner implements ApplicationRunner {

    private final BootstrapAdminService bootstrapAdminService;

    @Value("${app.bootstrap.admin.enabled:false}")
    private boolean enabled;

    @Value("${app.bootstrap.admin.tenant-name:}")
    private String tenantName;

    @Value("${app.bootstrap.admin.full-name:}")
    private String fullName;

    @Value("${app.bootstrap.admin.email:}")
    private String email;

    @Value("${app.bootstrap.admin.password:}")
    private String password;

    public BootstrapAdminRunner(BootstrapAdminService bootstrapAdminService) {
        this.bootstrapAdminService = bootstrapAdminService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        if (isBlank(tenantName) || isBlank(fullName) || isBlank(email) || isBlank(password)) {
            throw new IllegalStateException(
                    "Bootstrap habilitado, mas faltam variáveis para empresa, nome, e-mail ou senha do administrador."
            );
        }

        if (password.length() < 12) {
            throw new IllegalStateException("A senha inicial do administrador deve ter pelo menos 12 caracteres.");
        }

        bootstrapAdminService.provisionFirstAdmin(tenantName, fullName, email, password);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
