package com.estoque.api.controller;

import com.estoque.api.dto.CreateUserRequestDTO;
import com.estoque.api.dto.CreateUserResponseDTO;
import com.estoque.api.dto.UserResponseDTO;
import com.estoque.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> currentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PostMapping
    public ResponseEntity<CreateUserResponseDTO> createUser(@RequestBody CreateUserRequestDTO data) {
        CreateUserResponseDTO result = userService.createUser(data);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/provision-auth0")
    public ResponseEntity<CreateUserResponseDTO> retryAuth0Provisioning(@PathVariable Long id) {
        return ResponseEntity.ok(userService.retryAuth0Provisioning(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
