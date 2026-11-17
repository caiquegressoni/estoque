package com.estoque.api.dto;

public record CreateUserRequestDTO(
    String fullName,
    String email
) {
}
