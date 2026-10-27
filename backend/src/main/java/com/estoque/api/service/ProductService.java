package com.estoque.api.service;

import com.estoque.api.dto.ProductRequestDTO;
import com.estoque.api.dto.ProductResponseDTO;
import com.estoque.api.model.Product;
import com.estoque.api.model.UserModel;
import com.estoque.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    private UserModel getAuthenticatedUser() {
        return (UserModel) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // Criação do Produto
    public ProductResponseDTO createProduct(ProductRequestDTO data){
        UserModel loggedUser = getAuthenticatedUser();

        Product newProduct = new Product();
        newProduct.setName(data.name());
        newProduct.setDescription(data.description());
        newProduct.setPrice(data.price());
        newProduct.setQuantity(data.quantity());
        newProduct.setMinQuantity(data.minQuantity() != null ? data.minQuantity() : 5);
        newProduct.setInvoices(data.invoices());
        newProduct.setObservations(data.observations());
        newProduct.setCategory(data.category());
        newProduct.setLocation(data.location());

        // Vincula o produto à empresa do usuário logado
        newProduct.setTenant(loggedUser.getTenant());

        productRepository.save(newProduct);
        return new ProductResponseDTO(newProduct);
    }

    // Busca e lista os produtos, baseado no usuário que está fazendo a requisição
    public List<ProductResponseDTO> listProducts(){
        UserModel loggedUser = getAuthenticatedUser();
        List<Product> products = productRepository.findByTenant(loggedUser.getTenant());

        return products.stream().map(ProductResponseDTO::new).toList();
    }

    private Product getProductIfBelongToTenant(Long productId){
        UserModel loggedUser = getAuthenticatedUser();
        return productRepository.findByIdAndTenant(productId, loggedUser.getTenant())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado ou sem permissão de acesso"));
    }

    public ProductResponseDTO updateProduct(Long id, ProductRequestDTO data){
        Product product = getProductIfBelongToTenant(id);

        product.setName(data.name());
        product.setDescription(data.description());
        product.setPrice(data.price());
        product.setQuantity(data.quantity());
        if (data.minQuantity() != null) {
            product.setMinQuantity(data.minQuantity());
        }
        product.setInvoices(data.invoices());
        product.setObservations(data.observations());
        product.setCategory(data.category());
        product.setLocation(data.location());
        productRepository.save(product);
        return new ProductResponseDTO(product);
    }

    public void deleteProduct(Long id){
        Product product = getProductIfBelongToTenant(id);
        productRepository.delete(product);
    }
}
