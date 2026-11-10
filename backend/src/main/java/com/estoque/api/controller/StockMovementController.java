package com.estoque.api.controller;

import com.estoque.api.dto.StockMovementRequestDTO;
import com.estoque.api.dto.StockMovementResponseDTO;
import com.estoque.api.service.StockMovementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    @Autowired
    private StockMovementService movementService;

    @PostMapping
    public ResponseEntity<StockMovementResponseDTO> createMovement(@RequestBody StockMovementRequestDTO data) {
        StockMovementResponseDTO response = movementService.registerMovement(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<StockMovementResponseDTO>> listMovements() {
        return ResponseEntity.ok(movementService.listMovements());
    }
}
