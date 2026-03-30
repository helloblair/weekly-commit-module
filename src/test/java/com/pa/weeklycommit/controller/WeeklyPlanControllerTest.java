package com.pa.weeklycommit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pa.weeklycommit.dto.PlanResponse;
import com.pa.weeklycommit.dto.ReconciliationRequest;
import com.pa.weeklycommit.dto.WeeklyCommitResponse;
import com.pa.weeklycommit.exception.GlobalExceptionHandler;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.service.WeeklyPlanService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WeeklyPlanController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class WeeklyPlanControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean WeeklyPlanService planService;

    static final UUID PLAN_ID = UUID.randomUUID();
    static final UUID USER_ID = UUID.randomUUID();
    static final LocalDate MONDAY = LocalDate.of(2026, 4, 6);

    private PlanResponse samplePlan(PlanStatus status) {
        return new PlanResponse(
                PLAN_ID, USER_ID, MONDAY, status,
                status == PlanStatus.LOCKED ? OffsetDateTime.now() : null,
                null, null,
                OffsetDateTime.now(), OffsetDateTime.now(),
                List.of()
        );
    }

    @Nested
    class GetPlan {

        @Test
        @DisplayName("GET /api/v1/plans returns plan with 200")
        void returnsPlan() throws Exception {
            when(planService.getOrCreatePlan(USER_ID, MONDAY)).thenReturn(samplePlan(PlanStatus.DRAFT));

            mockMvc.perform(get("/api/v1/plans")
                            .param("userId", USER_ID.toString())
                            .param("weekOf", MONDAY.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(PLAN_ID.toString()))
                    .andExpect(jsonPath("$.status").value("DRAFT"))
                    .andExpect(jsonPath("$.weekOf").value("2026-04-06"));
        }

        @Test
        @DisplayName("GET /api/v1/plans with non-Monday returns 400")
        void rejectsNonMonday() throws Exception {
            when(planService.getOrCreatePlan(any(), any()))
                    .thenThrow(new IllegalArgumentException("weekOf must be a Monday"));

            mockMvc.perform(get("/api/v1/plans")
                            .param("userId", USER_ID.toString())
                            .param("weekOf", "2026-04-07"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.detail").value("weekOf must be a Monday"));
        }

        @Test
        @DisplayName("GET /api/v1/plans missing params returns 400")
        void rejectsMissingParams() throws Exception {
            mockMvc.perform(get("/api/v1/plans"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class LockPlan {

        @Test
        @DisplayName("POST /api/v1/plans/{id}/lock returns locked plan")
        void locksPlan() throws Exception {
            when(planService.lockPlan(PLAN_ID)).thenReturn(samplePlan(PlanStatus.LOCKED));

            mockMvc.perform(post("/api/v1/plans/{id}/lock", PLAN_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("LOCKED"))
                    .andExpect(jsonPath("$.lockedAt").isNotEmpty());
        }

        @Test
        @DisplayName("POST /api/v1/plans/{id}/lock on non-DRAFT returns 409")
        void rejectsNonDraft() throws Exception {
            when(planService.lockPlan(PLAN_ID))
                    .thenThrow(new IllegalTransitionException("Can only lock a DRAFT plan, current status: LOCKED"));

            mockMvc.perform(post("/api/v1/plans/{id}/lock", PLAN_ID))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.title").value("Illegal State Transition"))
                    .andExpect(jsonPath("$.detail").exists());
        }

        @Test
        @DisplayName("POST /api/v1/plans/{id}/lock with unknown ID returns 404")
        void returnsNotFound() throws Exception {
            UUID missing = UUID.randomUUID();
            when(planService.lockPlan(missing))
                    .thenThrow(new EntityNotFoundException("Plan not found: " + missing));

            mockMvc.perform(post("/api/v1/plans/{id}/lock", missing))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title").value("Not Found"));
        }
    }

    @Nested
    class StartReconciliation {

        @Test
        @DisplayName("POST /api/v1/plans/{id}/start-reconciliation returns 200")
        void startsReconciliation() throws Exception {
            PlanResponse response = new PlanResponse(
                    PLAN_ID, USER_ID, MONDAY, PlanStatus.RECONCILING,
                    OffsetDateTime.now(), OffsetDateTime.now(), null,
                    OffsetDateTime.now(), OffsetDateTime.now(), List.of()
            );
            when(planService.startReconciliation(PLAN_ID)).thenReturn(response);

            mockMvc.perform(post("/api/v1/plans/{id}/start-reconciliation", PLAN_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("RECONCILING"));
        }
    }

    @Nested
    class CompleteReconciliation {

        @Test
        @DisplayName("POST /api/v1/plans/{id}/complete-reconciliation returns 200")
        void completesReconciliation() throws Exception {
            UUID commitId = UUID.randomUUID();
            ReconciliationRequest request = new ReconciliationRequest(List.of(
                    new ReconciliationRequest.CommitReconciliation(
                            commitId, CompletionStatus.COMPLETED, "Done", null, false)
            ));

            PlanResponse response = new PlanResponse(
                    PLAN_ID, USER_ID, MONDAY, PlanStatus.RECONCILED,
                    OffsetDateTime.now(), OffsetDateTime.now(), OffsetDateTime.now(),
                    OffsetDateTime.now(), OffsetDateTime.now(),
                    List.of(new WeeklyCommitResponse(
                            commitId, PLAN_ID, "Commit", null, null, null,
                            "Done", "COMPLETED", null, null, List.of()
                    ))
            );
            when(planService.completeReconciliation(eq(PLAN_ID), any())).thenReturn(response);

            mockMvc.perform(post("/api/v1/plans/{id}/complete-reconciliation", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("RECONCILED"))
                    .andExpect(jsonPath("$.reconciledAt").isNotEmpty());
        }

        @Test
        @DisplayName("POST complete-reconciliation from DRAFT returns 409")
        void rejectsFromDraft() throws Exception {
            when(planService.completeReconciliation(eq(PLAN_ID), any()))
                    .thenThrow(new IllegalTransitionException("current status: DRAFT"));

            ReconciliationRequest request = new ReconciliationRequest(List.of());

            mockMvc.perform(post("/api/v1/plans/{id}/complete-reconciliation", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }
    }
}
