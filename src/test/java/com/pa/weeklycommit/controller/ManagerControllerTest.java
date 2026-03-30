package com.pa.weeklycommit.controller;

import com.pa.weeklycommit.dto.RcdoCoverageResponse;
import com.pa.weeklycommit.dto.TeamRollupResponse;
import com.pa.weeklycommit.exception.GlobalExceptionHandler;
import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.service.ManagerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ManagerController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class ManagerControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean ManagerService managerService;

    static final UUID MANAGER_ID = UUID.randomUUID();
    static final UUID ORG_ID = UUID.randomUUID();
    static final LocalDate MONDAY = LocalDate.of(2026, 4, 6);

    @Nested
    class TeamRollup {

        @Test
        @DisplayName("GET /api/v1/manager/team-rollup returns team data")
        void returnsTeamRollup() throws Exception {
            UUID memberId = UUID.randomUUID();
            UUID commitId = UUID.randomUUID();
            TeamRollupResponse response = new TeamRollupResponse(MONDAY, List.of(
                    new TeamRollupResponse.TeamMemberSummary(
                            memberId, "Alice", PlanStatus.LOCKED,
                            List.of(new TeamRollupResponse.CommitSummary(
                                    commitId, "Build SSO", ChessCategory.KING,
                                    CompletionStatus.COMPLETED, "Growth > Enterprise > SSO"
                            )),
                            new TeamRollupResponse.CompletionStats(1, 1, 0, 0, 0)
                    )
            ));
            when(managerService.getTeamRollup(MANAGER_ID, MONDAY)).thenReturn(response);

            mockMvc.perform(get("/api/v1/manager/team-rollup")
                            .param("managerId", MANAGER_ID.toString())
                            .param("weekOf", MONDAY.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.weekOf").value("2026-04-06"))
                    .andExpect(jsonPath("$.teamMembers[0].name").value("Alice"))
                    .andExpect(jsonPath("$.teamMembers[0].planStatus").value("LOCKED"))
                    .andExpect(jsonPath("$.teamMembers[0].stats.completed").value(1));
        }

        @Test
        @DisplayName("GET /api/v1/manager/team-rollup missing params returns 400")
        void rejectsMissingParams() throws Exception {
            mockMvc.perform(get("/api/v1/manager/team-rollup")
                            .param("managerId", MANAGER_ID.toString()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class RcdoCoverage {

        @Test
        @DisplayName("GET /api/v1/manager/rcdo-coverage returns coverage tree")
        void returnsCoverage() throws Exception {
            RcdoCoverageResponse response = new RcdoCoverageResponse(MONDAY, List.of(
                    new RcdoCoverageResponse.RallyCryCoverage(
                            UUID.randomUUID(), "Growth", true,
                            List.of(new RcdoCoverageResponse.DefiningObjectiveCoverage(
                                    UUID.randomUUID(), "Enterprise", true,
                                    List.of(new RcdoCoverageResponse.OutcomeCoverage(
                                            UUID.randomUUID(), "SSO", true, 1.0,
                                            List.of(new RcdoCoverageResponse.CommitRef(
                                                    UUID.randomUUID(), UUID.randomUUID(),
                                                    "Alice", "Build SSO", CompletionStatus.COMPLETED
                                            ))
                                    ))
                            ))
                    )
            ));
            when(managerService.getRcdoCoverage(MANAGER_ID, ORG_ID, MONDAY)).thenReturn(response);

            mockMvc.perform(get("/api/v1/manager/rcdo-coverage")
                            .param("managerId", MANAGER_ID.toString())
                            .param("orgId", ORG_ID.toString())
                            .param("weekOf", MONDAY.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.rallyCries[0].title").value("Growth"))
                    .andExpect(jsonPath("$.rallyCries[0].covered").value(true))
                    .andExpect(jsonPath("$.rallyCries[0].definingObjectives[0].outcomes[0].completionRate").value(1.0));
        }

        @Test
        @DisplayName("GET /api/v1/manager/rcdo-coverage missing orgId returns 400")
        void rejectsMissingOrgId() throws Exception {
            mockMvc.perform(get("/api/v1/manager/rcdo-coverage")
                            .param("managerId", MANAGER_ID.toString())
                            .param("weekOf", MONDAY.toString()))
                    .andExpect(status().isBadRequest());
        }
    }
}
