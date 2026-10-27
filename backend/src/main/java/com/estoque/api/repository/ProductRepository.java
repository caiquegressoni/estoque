package com.estoque.api.repository;

import com.estoque.api.model.Product;
import com.estoque.api.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByName(String name);

    List<Product> findByTenant(Tenant tenant);

    Optional<Product> findByIdAndTenant(Long id, Tenant tenant);
}
