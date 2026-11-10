package com.estoque.api.controller;

import com.estoque.api.dto.ProductRequestDTO;
import com.estoque.api.dto.ProductResponseDTO;
import com.estoque.api.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    @Autowired
    private ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponseDTO> createProduct(@RequestBody ProductRequestDTO data){

        ProductResponseDTO response = productService.createProduct(data);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponseDTO>> listAllProducts(){
        var list = productService.listProducts();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable long id,
                                                           @RequestBody ProductRequestDTO data){
        ProductResponseDTO updateProduct = productService.updateProduct(id, data);
        return ResponseEntity.ok(updateProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id){
        productService.deleteProduct(id);
        //Retorna 204 para seucesso na exclusão
        return ResponseEntity.noContent().build();
    }
}
