package com.estoque.api.service;

import com.estoque.api.model.Tenant;
import com.estoque.api.model.UserModel;
import com.estoque.api.model.enums.UserRole;
import com.estoque.api.repository.TenantRepository;
import com.estoque.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BootstrapAdminServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private BootstrapAdminService bootstrapAdminService;

    @Test
    void createsTenantAndAdminWhenDatabaseHasNoUsers() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Exemplo");

        when(userRepository.findByEmail("admin@exemplo.com")).thenReturn(Optional.empty());
        when(userRepository.count()).thenReturn(0L);
        when(tenantRepository.findByName("Empresa Exemplo")).thenReturn(Optional.empty());
        when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);
        when(passwordEncoder.encode("senha-segura-123")).thenReturn("hash-da-senha");

        bootstrapAdminService.provisionFirstAdmin(
                " Empresa Exemplo ",
                "Admin Exemplo",
                "ADMIN@EXEMPLO.COM ",
                "senha-segura-123"
        );

        ArgumentCaptor<UserModel> userCaptor = ArgumentCaptor.forClass(UserModel.class);
        verify(userRepository).save(userCaptor.capture());
        UserModel createdUser = userCaptor.getValue();

        assertEquals("admin@exemplo.com", createdUser.getEmail());
        assertEquals("hash-da-senha", createdUser.getPassword());
        assertEquals(UserRole.ADMIN, createdUser.getRole());
        assertEquals("Empresa Exemplo", createdUser.getTenant().getName());
    }

    @Test
    void isIdempotentWhenTheSameBootstrapAdminAlreadyExists() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Exemplo");
        UserModel existingAdmin = new UserModel(
                "Admin Exemplo", "admin@exemplo.com", "hash", UserRole.ADMIN, tenant
        );
        when(userRepository.findByEmail("admin@exemplo.com")).thenReturn(Optional.of(existingAdmin));

        bootstrapAdminService.provisionFirstAdmin(
                "Empresa Exemplo", "Admin Exemplo", "admin@exemplo.com", "senha-segura-123"
        );

        verify(userRepository, never()).count();
        verify(userRepository, never()).save(any(UserModel.class));
        verify(tenantRepository, never()).save(any(Tenant.class));
    }

    @Test
    void refusesToCreateAnAdminWhenOtherUsersAlreadyExist() {
        when(userRepository.findByEmail("admin@exemplo.com")).thenReturn(Optional.empty());
        when(userRepository.count()).thenReturn(1L);

        assertThrows(IllegalStateException.class, () -> bootstrapAdminService.provisionFirstAdmin(
                "Empresa Exemplo", "Admin Exemplo", "admin@exemplo.com", "senha-segura-123"
        ));

        verify(tenantRepository, never()).save(any(Tenant.class));
        verify(userRepository, never()).save(any(UserModel.class));
    }
}
