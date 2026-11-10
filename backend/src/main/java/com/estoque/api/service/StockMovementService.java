package com.estoque.api.service;

import com.estoque.api.dto.StockMovementRequestDTO;
import com.estoque.api.dto.StockMovementResponseDTO;
import com.estoque.api.model.Product;
import com.estoque.api.model.StockMovement;
import com.estoque.api.model.UserModel;
import com.estoque.api.model.enums.MovementType;
import com.estoque.api.repository.ProductRepository;
import com.estoque.api.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StockMovementService {

    @Autowired
    private StockMovementRepository movementRepository;

    @Autowired
    private ProductRepository productRepository;

    private UserModel getAuthenticatedUser() {
        return (UserModel) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @Transactional
    public StockMovementResponseDTO registerMovement(StockMovementRequestDTO data) {
        UserModel user = getAuthenticatedUser();

        // 1. Busca o produto garantindo isolamento da empresa (Tenant)
        Product product = productRepository.findByIdAndTenant(data.productId(), user.getTenant())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado ou sem permissão."));

        // 2. Validação de Estoque (Impede saldo negativo)
        if (data.type() == MovementType.SAIDA) {
            if (product.getQuantity() < data.quantity()) {
                throw new RuntimeException("Estoque insuficiente! Saldo atual: " + product.getQuantity());
            }
            product.setQuantity(product.getQuantity() - data.quantity());
        } else {
            product.setQuantity(product.getQuantity() + data.quantity());
        }

        // 3. Atualiza o saldo do produto no banco
        productRepository.save(product);

        // 4. Grava o registro de auditoria da movimentação
        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setType(data.type());
        movement.setQuantity(data.quantity());
        movement.setReason(data.reason());
        movement.setInvoiceNumber(data.invoiceNumber());
        movement.setUser(user);
        movement.setTenant(user.getTenant());

        movementRepository.save(movement);
        return new StockMovementResponseDTO(movement);
    }

    public List<StockMovementResponseDTO> listMovements() {
        UserModel user = getAuthenticatedUser();
        return movementRepository.findByTenantOrderByCreatedAtDesc(user.getTenant())
                .stream()
                .map(StockMovementResponseDTO::new)
                .toList();
    }
}
