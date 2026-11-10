package com.estoque.api.model;

import com.estoque.api.model.enums.UserRole;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.text.Normalizer;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class UserModel implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false, updatable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    public UserModel() {
    }

    public UserModel(String fullName, String email, String password, UserRole role, Tenant tenant) {
        this.setFullName(fullName); // Chama o setter para gerar o username automaticamente
        this.email = email;
        this.password = password;
        this.role = role;
        this.tenant = tenant;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    // O pulo do gato: Quando setar o nome, gera o username automaticamente
    public void setFullName(String fullName) {
        this.fullName = fullName;
        this.username = generateUsername(fullName);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    // O username agora é gerado pelo setFullName, mas mantemos o setter padrão se necessário pelo Hibernate
    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    // Lógica interna para gerar o username (ex: "Caique Gressoni" -> "caique.gressoni")
    private String generateUsername(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return null;
        }

        // Remove os acentos (ex: João -> Joao)
        String normalized = Normalizer.normalize(fullName.trim(), Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}", "");

        // Quebra pelos espaços em branco (Regex correta: \\s+)
        String[] parts = normalized.split("\\s+");

        String firstName = parts[0].toLowerCase();
        
        if (parts.length == 1) {
            return firstName;
        }

        String lastName = parts[parts.length - 1].toLowerCase();
        
        // Remove tudo que não for letra ou número para garantir um login limpo
        firstName = firstName.replaceAll("[^a-z0-9]", "");
        lastName = lastName.replaceAll("[^a-z0-9]", "");

        return firstName + "." + lastName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }

    @Override
    public String toString() {
        return "UserModel{" +
                "id=" + id +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                ", username='" + username + '\'' +
                ", role=" + role +
                '}';
    }
}
