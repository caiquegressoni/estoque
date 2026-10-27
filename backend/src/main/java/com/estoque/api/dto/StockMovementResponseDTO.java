package com.estoque.api.dto;

import com.estoque.api.model.StockMovement;
import com.estoque.api.model.enums.MovementType;
import java.time.LocalDateTime;

public record StockMovementResponseDTO(
    Long id,
    Long productId,
    String productName,
    MovementType type,
    Integer quantity,
    String reason,
    String invoiceNumber,
    String username,
    LocalDateTime createdAt
) {
    public StockMovementResponseDTO(StockMovement m) {
        this(
            m.getId(),
            m.getProduct().getId(),
            m.getProduct().getName(),
            m.getType(),
            m.getQuantity(),
            m.getReason(),
            m.getInvoiceNumber(),
            m.getUser().getUsername(),
            m.getCreatedAt()
        );
    }
}
