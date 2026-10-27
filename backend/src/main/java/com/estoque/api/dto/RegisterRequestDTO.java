package com.estoque.api.dto;

import com.estoque.api.model.enums.UserRole;

public record RegisterRequestDTO(String fullName, String email, String password, UserRole role, Long tenantId) {

}
