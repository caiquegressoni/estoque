package com.estoque.api.dto;

import com.estoque.api.model.enums.UserRole;

public record CreateUserRequestDTO(
    String fullName,
    String email,
    UserRole role
) {
}
