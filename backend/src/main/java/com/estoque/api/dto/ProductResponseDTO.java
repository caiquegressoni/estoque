package com.estoque.api.dto;

import java.math.BigDecimal;
import com.estoque.api.model.Product;

public record ProductResponseDTO(
    Long id, 
    String name, 
    String description, 
    BigDecimal price, 
    Integer quantity,
    Integer minQuantity,
    boolean isLowStock,
    String invoices,
    String observations,
    String category,
    String location
) {
    public ProductResponseDTO(Product product) {
        this(
            product.getId(), 
            product.getName(),
            product.getDescription(), 
            product.getPrice(), 
            product.getQuantity(),
            product.getMinQuantity() != null ? product.getMinQuantity() : 5,
            product.getQuantity() != null && product.getMinQuantity() != null && product.getQuantity() <= product.getMinQuantity(),
            product.getInvoices(),
            product.getObservations(),
            product.getCategory(),
            product.getLocation()
        );
    }
}
