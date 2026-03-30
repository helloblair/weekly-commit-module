package com.pa.weeklycommit.controller;

import com.pa.weeklycommit.dto.RcdoCoverageResponse;
import com.pa.weeklycommit.dto.TeamRollupResponse;
import com.pa.weeklycommit.service.ManagerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/manager")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/team-rollup")
    public TeamRollupResponse getTeamRollup(
            @RequestParam UUID managerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekOf) {
        return managerService.getTeamRollup(managerId, weekOf);
    }

    @GetMapping("/rcdo-coverage")
    public RcdoCoverageResponse getRcdoCoverage(
            @RequestParam UUID managerId,
            @RequestParam UUID orgId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekOf) {
        return managerService.getRcdoCoverage(managerId, orgId, weekOf);
    }
}
