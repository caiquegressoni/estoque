package com.estoque.api.controller;

import com.estoque.api.dto.AlertsSummaryDTO;
import com.estoque.api.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public ResponseEntity<AlertsSummaryDTO> getAlerts() {
        return ResponseEntity.ok(alertService.getAlerts());
    }
}
