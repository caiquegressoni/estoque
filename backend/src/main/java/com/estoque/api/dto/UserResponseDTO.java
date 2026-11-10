package com.estoque.api.dto;

import com.estoque.api.model.UserModel;
import com.estoque.api.model.enums.UserRole;

public record UserResponseDTO(
    Long id,
    String fullName,
    String username,
    String email,
    UserRole role
) {
    public UserResponseDTO(UserModel user) {
        this(
            user.getId(),
            user.getFullName(),
            user.getUsername(),
            user.getEmail(),
            user.getRole()
        );
    }
}
