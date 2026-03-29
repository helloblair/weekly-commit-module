package com.pa.weeklycommit.controller;

import com.pa.weeklycommit.dto.RcdoHierarchyResponse;
import com.pa.weeklycommit.service.RcdoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rcdo")
public class RcdoController {

    private final RcdoService rcdoService;

    public RcdoController(RcdoService rcdoService) {
        this.rcdoService = rcdoService;
    }

    @GetMapping("/hierarchy")
    public RcdoHierarchyResponse getHierarchy(@RequestParam UUID orgId) {
        return rcdoService.getHierarchy(orgId);
    }
}
