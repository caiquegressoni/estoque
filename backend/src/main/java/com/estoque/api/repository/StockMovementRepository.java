package com.estoque.api.repository;

import com.estoque.api.model.StockMovement;
import com.estoque.api.model.Tenant;
import com.estoque.api.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByTenantOrderByCreatedAtDesc(Tenant tenant);
    List<StockMovement> findByProductIdAndTenantOrderByCreatedAtDesc(Long productId, Tenant tenant);
    boolean existsByUser(UserModel user);
}
