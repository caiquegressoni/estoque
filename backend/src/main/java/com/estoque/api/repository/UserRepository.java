package com.estoque.api.repository;

import com.estoque.api.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserModel, Long> {
    Optional<UserModel> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<UserModel> findByEmail(String email);

    java.util.List<UserModel> findByTenant(com.estoque.api.model.Tenant tenant);
}
