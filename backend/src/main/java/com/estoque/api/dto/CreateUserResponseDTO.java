package com.estoque.api.dto;

public record CreateUserResponseDTO(
        UserResponseDTO user,
        boolean passwordSetupRequired,
        boolean passwordSetupEmailSent
) {
}
