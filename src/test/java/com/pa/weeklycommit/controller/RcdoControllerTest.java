package com.pa.weeklycommit.controller;

import com.pa.weeklycommit.dto.RcdoHierarchyResponse;
import com.pa.weeklycommit.exception.GlobalExceptionHandler;
import com.pa.weeklycommit.service.RcdoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RcdoController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class RcdoControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean RcdoService rcdoService;

    @Test
    @DisplayName("GET /api/v1/rcdo/hierarchy returns RCDO tree")
    void returnsHierarchy() throws Exception {
        UUID orgId = UUID.randomUUID();
        RcdoHierarchyResponse response = new RcdoHierarchyResponse(List.of(
                new RcdoHierarchyResponse.RallyCryNode(
                        UUID.randomUUID(), "Revenue Growth", "Drive 40% YoY",
                        List.of(new RcdoHierarchyResponse.DefiningObjectiveNode(
                                UUID.randomUUID(), "Enterprise Tier", "Ship by Q2",
                                List.of(new RcdoHierarchyResponse.OutcomeNode(
                                        UUID.randomUUID(), "Pricing page live", null, "Live by Apr 15"
                                ))
                        ))
                )
        ));
        when(rcdoService.getHierarchy(orgId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/rcdo/hierarchy").param("orgId", orgId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rallyCries[0].title").value("Revenue Growth"))
                .andExpect(jsonPath("$.rallyCries[0].definingObjectives[0].title").value("Enterprise Tier"))
                .andExpect(jsonPath("$.rallyCries[0].definingObjectives[0].outcomes[0].measurableTarget").value("Live by Apr 15"));
    }

    @Test
    @DisplayName("GET /api/v1/rcdo/hierarchy with no orgId returns 400")
    void rejectsMissingOrgId() throws Exception {
        mockMvc.perform(get("/api/v1/rcdo/hierarchy"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/rcdo/hierarchy for unknown org returns empty list")
    void returnsEmptyForUnknownOrg() throws Exception {
        UUID orgId = UUID.randomUUID();
        when(rcdoService.getHierarchy(orgId)).thenReturn(new RcdoHierarchyResponse(List.of()));

        mockMvc.perform(get("/api/v1/rcdo/hierarchy").param("orgId", orgId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rallyCries").isEmpty());
    }
}
