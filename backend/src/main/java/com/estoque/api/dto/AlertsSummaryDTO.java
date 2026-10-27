package com.estoque.api.dto;

import java.util.List;

public record AlertsSummaryDTO(
    long totalAlerts,
    long criticalCount,
    long warningCount,
    List<AlertItemDTO> items
) {
    public record AlertItemDTO(
        Long productId,
        String productName,
        String category,
        String location,
        int currentQuantity,
        int minQuantity,
        String severity, // "CRITICAL" ou "WARNING"
        String message
    ) {}
}
