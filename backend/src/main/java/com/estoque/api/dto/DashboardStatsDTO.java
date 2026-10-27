package com.estoque.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardStatsDTO(
    long totalProducts,
    long totalStockVolume,
    BigDecimal totalStockValue,
    long lowStockCount,
    long totalMovements,
    List<TimelinePointDTO> timeline,
    List<TopProductDTO> topProducts,
    List<CategoryDistributionDTO> categoryDistribution,
    List<RecentActivityDTO> recentActivities
) {
    public record TimelinePointDTO(
        String date,
        int entradas,
        int saidas
    ) {}

    public record TopProductDTO(
        Long productId,
        String productName,
        int totalMoved,
        int currentStock
    ) {}

    public record CategoryDistributionDTO(
        String category,
        BigDecimal totalValue,
        int productCount,
        double percentage
    ) {}

    public record RecentActivityDTO(
        Long id,
        String productName,
        String type,
        int quantity,
        String username,
        LocalDateTime createdAt
    ) {}
}
