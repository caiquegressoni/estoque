package com.estoque.api.dto;

import java.math.BigDecimal;

public record ProductRequestDTO(
    String name, 
    String description, 
    BigDecimal price, 
    Integer quantity,
    Integer minQuantity,
    String invoices,
    String observations,
    String category,
    String location
) {
}
