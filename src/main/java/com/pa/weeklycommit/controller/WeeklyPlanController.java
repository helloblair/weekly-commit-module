package com.pa.weeklycommit.controller;

import com.pa.weeklycommit.dto.PlanResponse;
import com.pa.weeklycommit.dto.ReconciliationRequest;
import com.pa.weeklycommit.service.WeeklyPlanService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plans")
public class WeeklyPlanController {

    private final WeeklyPlanService planService;

    public WeeklyPlanController(WeeklyPlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    public PlanResponse getPlan(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekOf,
            @RequestParam UUID userId) {
        return planService.getOrCreatePlan(userId, weekOf);
    }

    @PostMapping("/{id}/lock")
    public PlanResponse lockPlan(@PathVariable UUID id) {
        return planService.lockPlan(id);
    }

    @PostMapping("/{id}/start-reconciliation")
    public PlanResponse startReconciliation(@PathVariable UUID id) {
        return planService.startReconciliation(id);
    }

    @PostMapping("/{id}/complete-reconciliation")
    public PlanResponse completeReconciliation(@PathVariable UUID id,
                                               @RequestBody ReconciliationRequest request) {
        return planService.completeReconciliation(id, request);
    }
}
