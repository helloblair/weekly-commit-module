package com.pa.weeklycommit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pa.weeklycommit.dto.CommitCreateRequest;
import com.pa.weeklycommit.dto.CommitUpdateRequest;
import com.pa.weeklycommit.dto.RcdoLinkRequest;
import com.pa.weeklycommit.dto.RcdoLinkResponse;
import com.pa.weeklycommit.dto.WeeklyCommitResponse;
import com.pa.weeklycommit.exception.GlobalExceptionHandler;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.service.WeeklyCommitService;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WeeklyCommitController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class WeeklyCommitControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean WeeklyCommitService commitService;

    static final UUID PLAN_ID = UUID.randomUUID();
    static final UUID COMMIT_ID = UUID.randomUUID();
    static final UUID RC_ID = UUID.randomUUID();
    static final UUID DO_ID = UUID.randomUUID();
    static final UUID O_ID = UUID.randomUUID();

    private WeeklyCommitResponse sampleResponse() {
        return new WeeklyCommitResponse(
                COMMIT_ID, PLAN_ID, "Ship API", "REST endpoints",
                "QUEEN", 1, null, null, null, null,
                List.of(new RcdoLinkResponse(RC_ID, "Growth", DO_ID, "Enterprise", O_ID, "SSO"))
        );
    }

    @Nested
    class GetCommits {

        @Test
        @DisplayName("GET /api/v1/plans/{planId}/commits returns commit list")
        void returnsCommits() throws Exception {
            when(commitService.getCommitsByPlan(PLAN_ID)).thenReturn(List.of(sampleResponse()));

            mockMvc.perform(get("/api/v1/plans/{planId}/commits", PLAN_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].title").value("Ship API"))
                    .andExpect(jsonPath("$[0].rcdoLinks[0].rallyCryTitle").value("Growth"));
        }
    }

    @Nested
    class CreateCommit {

        @Test
        @DisplayName("POST /api/v1/plans/{planId}/commits returns 201")
        void createsCommit() throws Exception {
            CommitCreateRequest request = new CommitCreateRequest(
                    "Ship API", "REST endpoints",
                    List.of(new RcdoLinkRequest(RC_ID, DO_ID, O_ID)));

            when(commitService.createCommit(eq(PLAN_ID), any())).thenReturn(sampleResponse());

            mockMvc.perform(post("/api/v1/plans/{planId}/commits", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(COMMIT_ID.toString()))
                    .andExpect(jsonPath("$.title").value("Ship API"));
        }

        @Test
        @DisplayName("POST with blank title returns 400")
        void rejectsBlankTitle() throws Exception {
            CommitCreateRequest request = new CommitCreateRequest(
                    "", null,
                    List.of(new RcdoLinkRequest(RC_ID, DO_ID, O_ID)));

            mockMvc.perform(post("/api/v1/plans/{planId}/commits", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("POST with empty RCDO links returns 400")
        void rejectsEmptyRcdoLinks() throws Exception {
            CommitCreateRequest request = new CommitCreateRequest(
                    "Valid title", null, List.of());

            mockMvc.perform(post("/api/v1/plans/{planId}/commits", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("POST with null RCDO link fields returns 400")
        void rejectsNullRcdoFields() throws Exception {
            CommitCreateRequest request = new CommitCreateRequest(
                    "Title", null,
                    List.of(new RcdoLinkRequest(null, DO_ID, O_ID)));

            mockMvc.perform(post("/api/v1/plans/{planId}/commits", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("POST on LOCKED plan returns 409")
        void rejectsLockedPlan() throws Exception {
            CommitCreateRequest request = new CommitCreateRequest(
                    "X", null, List.of(new RcdoLinkRequest(RC_ID, DO_ID, O_ID)));

            when(commitService.createCommit(eq(PLAN_ID), any()))
                    .thenThrow(new IllegalTransitionException("Plan must be in DRAFT status"));

            mockMvc.perform(post("/api/v1/plans/{planId}/commits", PLAN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("POST with unknown plan returns 404")
        void returnsNotFound() throws Exception {
            UUID missing = UUID.randomUUID();
            CommitCreateRequest request = new CommitCreateRequest(
                    "X", null, List.of(new RcdoLinkRequest(RC_ID, DO_ID, O_ID)));

            when(commitService.createCommit(eq(missing), any()))
                    .thenThrow(new EntityNotFoundException("Plan not found"));

            mockMvc.perform(post("/api/v1/plans/{planId}/commits", missing)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    class UpdateCommit {

        @Test
        @DisplayName("PUT /api/v1/commits/{id} returns updated commit")
        void updatesCommit() throws Exception {
            CommitUpdateRequest request = new CommitUpdateRequest(
                    "Updated", "New desc", "KING", 1, null);

            WeeklyCommitResponse updated = new WeeklyCommitResponse(
                    COMMIT_ID, PLAN_ID, "Updated", "New desc",
                    "KING", 1, null, null, null, null, List.of());
            when(commitService.updateCommit(eq(COMMIT_ID), any())).thenReturn(updated);

            mockMvc.perform(put("/api/v1/commits/{commitId}", COMMIT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated"))
                    .andExpect(jsonPath("$.chessCategory").value("KING"));
        }

        @Test
        @DisplayName("PUT with title exceeding 255 chars returns 400")
        void rejectsLongTitle() throws Exception {
            String longTitle = "x".repeat(256);
            CommitUpdateRequest request = new CommitUpdateRequest(
                    longTitle, null, null, null, null);

            mockMvc.perform(put("/api/v1/commits/{commitId}", COMMIT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class DeleteCommit {

        @Test
        @DisplayName("DELETE /api/v1/commits/{id} returns 204")
        void deletesCommit() throws Exception {
            doNothing().when(commitService).deleteCommit(COMMIT_ID);

            mockMvc.perform(delete("/api/v1/commits/{commitId}", COMMIT_ID))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("DELETE on LOCKED plan returns 409")
        void rejectsLockedPlan() throws Exception {
            doThrow(new IllegalTransitionException("Plan must be in DRAFT status"))
                    .when(commitService).deleteCommit(COMMIT_ID);

            mockMvc.perform(delete("/api/v1/commits/{commitId}", COMMIT_ID))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("DELETE unknown commit returns 404")
        void returnsNotFound() throws Exception {
            UUID missing = UUID.randomUUID();
            doThrow(new EntityNotFoundException("Commit not found"))
                    .when(commitService).deleteCommit(missing);

            mockMvc.perform(delete("/api/v1/commits/{commitId}", missing))
                    .andExpect(status().isNotFound());
        }
    }
}
