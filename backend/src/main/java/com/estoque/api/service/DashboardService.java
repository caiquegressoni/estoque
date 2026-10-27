package com.estoque.api.service;

import com.estoque.api.dto.DashboardStatsDTO;
import com.estoque.api.model.Product;
import com.estoque.api.model.StockMovement;
import com.estoque.api.model.Tenant;
import com.estoque.api.model.UserModel;
import com.estoque.api.model.enums.MovementType;
import com.estoque.api.repository.ProductRepository;
import com.estoque.api.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    private UserModel getAuthenticatedUser() {
        return (UserModel) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public DashboardStatsDTO getStats(int days) {
        UserModel loggedUser = getAuthenticatedUser();
        Tenant tenant = loggedUser.getTenant();

        List<Product> products = productRepository.findByTenant(tenant);
        List<StockMovement> movements = stockMovementRepository.findByTenantOrderByCreatedAtDesc(tenant);

        // 1. Métricas Gerais
        long totalProducts = products.size();
        long totalStockVolume = products.stream()
                .mapToLong(p -> p.getQuantity() != null ? p.getQuantity() : 0)
                .sum();

        BigDecimal totalStockValue = products.stream()
                .map(p -> (p.getPrice() != null && p.getQuantity() != null)
                        ? p.getPrice().multiply(BigDecimal.valueOf(p.getQuantity()))
                        : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int safeDays = Math.max(1, Math.min(days, 365));
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(safeDays - 1);
        java.time.LocalDateTime startDateTime = startDate.atStartOfDay();

        long lowStockCount = products.stream()
                .filter(p -> (p.getQuantity() != null ? p.getQuantity() : 0) <= (p.getMinQuantity() != null ? p.getMinQuantity() : 5))
                .count();

        long totalMovementsInPeriod = movements.stream()
                .filter(m -> m.getCreatedAt() != null && !m.getCreatedAt().isBefore(startDateTime))
                .count();

        // 2. Fluxo Temporal
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        List<DashboardStatsDTO.TimelinePointDTO> timeline = new ArrayList<>();

        for (int i = safeDays - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String label = date.format(formatter);
            int entradas = 0;
            int saidas = 0;

            for (StockMovement m : movements) {
                if (m.getCreatedAt() != null && m.getCreatedAt().toLocalDate().isEqual(date)) {
                    if (m.getType() == MovementType.ENTRADA) {
                        entradas += (m.getQuantity() != null ? m.getQuantity() : 0);
                    } else if (m.getType() == MovementType.SAIDA) {
                        saidas += (m.getQuantity() != null ? m.getQuantity() : 0);
                    }
                }
            }
            timeline.add(new DashboardStatsDTO.TimelinePointDTO(label, entradas, saidas));
        }

        // 3. Top 5 Produtos com Maior Giro (Saídas no período selecionado)
        Map<Long, Integer> productSaidas = new HashMap<>();
        for (StockMovement m : movements) {
            if (m.getCreatedAt() != null && !m.getCreatedAt().isBefore(startDateTime)) {
                if (m.getType() == MovementType.SAIDA && m.getProduct() != null) {
                    productSaidas.merge(m.getProduct().getId(), m.getQuantity() != null ? m.getQuantity() : 0, Integer::sum);
                }
            }
        }

        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (p1, p2) -> p1));

        List<DashboardStatsDTO.TopProductDTO> topProducts = productSaidas.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Product prod = productMap.get(entry.getKey());
                    String name = prod != null ? prod.getName() : "Item #" + entry.getKey();
                    int currentStock = prod != null && prod.getQuantity() != null ? prod.getQuantity() : 0;
                    return new DashboardStatsDTO.TopProductDTO(entry.getKey(), name, entry.getValue(), currentStock);
                })
                .toList();

        // 4. Distribuição do Patrimônio por Categoria
        Map<String, List<Product>> byCategory = products.stream()
                .collect(Collectors.groupingBy(p -> (p.getCategory() != null && !p.getCategory().trim().isEmpty()) ? p.getCategory().trim() : "Geral"));

        BigDecimal finalTotalValue = totalStockValue;
        List<DashboardStatsDTO.CategoryDistributionDTO> categoryDistribution = byCategory.entrySet().stream()
                .map(entry -> {
                    String cat = entry.getKey();
                    List<Product> prods = entry.getValue();
                    BigDecimal catValue = prods.stream()
                            .map(p -> (p.getPrice() != null && p.getQuantity() != null)
                                    ? p.getPrice().multiply(BigDecimal.valueOf(p.getQuantity()))
                                    : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    double pct = 0.0;
                    if (finalTotalValue.compareTo(BigDecimal.ZERO) > 0) {
                        pct = catValue.divide(finalTotalValue, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                        pct = Math.round(pct * 10.0) / 10.0;
                    }
                    return new DashboardStatsDTO.CategoryDistributionDTO(cat, catValue, prods.size(), pct);
                })
                .sorted((c1, c2) -> c2.totalValue().compareTo(c1.totalValue()))
                .toList();

        // 5. Feed de Atividades Recentes
        List<DashboardStatsDTO.RecentActivityDTO> recentActivities = movements.stream()
                .limit(6)
                .map(m -> new DashboardStatsDTO.RecentActivityDTO(
                        m.getId(),
                        m.getProduct() != null ? m.getProduct().getName() : "Item",
                        m.getType() != null ? m.getType().name() : "ENTRADA",
                        m.getQuantity() != null ? m.getQuantity() : 0,
                        m.getUser() != null ? m.getUser().getUsername() : "Operador",
                        m.getCreatedAt()
                ))
                .toList();

        return new DashboardStatsDTO(
                totalProducts,
                totalStockVolume,
                totalStockValue,
                lowStockCount,
                totalMovementsInPeriod,
                timeline,
                topProducts,
                categoryDistribution,
                recentActivities
        );
    }
}
