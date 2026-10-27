package com.estoque.api.dto;

import com.estoque.api.model.enums.MovementType;

public record StockMovementRequestDTO(
    Long productId,
    MovementType type,
    Integer quantity,
    String reason,
    String invoiceNumber
) {
}
