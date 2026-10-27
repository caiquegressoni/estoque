package com.estoque.api.service;

import com.estoque.api.dto.AlertsSummaryDTO;
import com.estoque.api.model.Product;
import com.estoque.api.model.Tenant;
import com.estoque.api.model.UserModel;
import com.estoque.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AlertService {

    @Autowired
    private ProductRepository productRepository;

    private UserModel getAuthenticatedUser() {
        return (UserModel) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public AlertsSummaryDTO getAlerts() {
        UserModel user = getAuthenticatedUser();
        Tenant tenant = user.getTenant();

        List<Product> products = productRepository.findByTenant(tenant);
        List<AlertsSummaryDTO.AlertItemDTO> items = new ArrayList<>();

        long criticalCount = 0;
        long warningCount = 0;

        for (Product p : products) {
            int qty = (p.getQuantity() != null) ? p.getQuantity() : 0;
            int minQty = (p.getMinQuantity() != null) ? p.getMinQuantity() : 5;

            if (qty == 0) {
                criticalCount++;
                items.add(new AlertsSummaryDTO.AlertItemDTO(
                        p.getId(),
                        p.getName(),
                        (p.getCategory() != null && !p.getCategory().isBlank()) ? p.getCategory() : "Geral",
                        (p.getLocation() != null && !p.getLocation().isBlank()) ? p.getLocation() : "Não informada",
                        qty,
                        minQty,
                        "CRITICAL",
                        "Estoque esgotado! Risco imediato de paralisação da operação."
                ));
            } else if (qty <= minQty) {
                warningCount++;
                items.add(new AlertsSummaryDTO.AlertItemDTO(
                        p.getId(),
                        p.getName(),
                        (p.getCategory() != null && !p.getCategory().isBlank()) ? p.getCategory() : "Geral",
                        (p.getLocation() != null && !p.getLocation().isBlank()) ? p.getLocation() : "Não informada",
                        qty,
                        minQty,
                        "WARNING",
                        "Saldo crítico (" + qty + "/" + minQty + " un). Requer reposição preventiva."
                ));
            }
        }

        // Ordenação inteligente: CRITICAL primeiro, depois menor quantidade atual
        items.sort((a, b) -> {
            if (a.severity().equals(b.severity())) {
                return Integer.compare(a.currentQuantity(), b.currentQuantity());
            }
            return a.severity().equals("CRITICAL") ? -1 : 1;
        });

        return new AlertsSummaryDTO(
                items.size(),
                criticalCount,
                warningCount,
                items
        );
    }
}
