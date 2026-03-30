package com.pa.weeklycommit.service;

import com.pa.weeklycommit.TestcontainersConfig;
import com.pa.weeklycommit.dto.RcdoHierarchyResponse;
import com.pa.weeklycommit.entity.DefiningObjective;
import com.pa.weeklycommit.entity.Outcome;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.repository.RallyCryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class RcdoServiceTest extends TestcontainersConfig {

    @Autowired RcdoService rcdoService;
    @Autowired RallyCryRepository rallyCryRepository;

    private UUID orgId;

    @BeforeEach
    void seed() {
        orgId = UUID.randomUUID();

        RallyCry rc = new RallyCry();
        rc.setOrgId(orgId);
        rc.setTitle("Revenue Growth");

        DefiningObjective d1 = new DefiningObjective();
        d1.setRallyCry(rc);
        d1.setTitle("Launch Enterprise");
        rc.getDefiningObjectives().add(d1);

        Outcome o1 = new Outcome();
        o1.setDefiningObjective(d1);
        o1.setTitle("Pricing page live");
        o1.setMeasurableTarget("Live by Q2");
        d1.getOutcomes().add(o1);

        Outcome o2 = new Outcome();
        o2.setDefiningObjective(d1);
        o2.setTitle("SSO complete");
        d1.getOutcomes().add(o2);

        // Inactive objective — should be filtered out
        DefiningObjective inactive = new DefiningObjective();
        inactive.setRallyCry(rc);
        inactive.setTitle("Deprecated DO");
        inactive.setActive(false);
        rc.getDefiningObjectives().add(inactive);

        rallyCryRepository.save(rc);
    }

    @Test
    @DisplayName("returns active RCDO hierarchy for org")
    void returnsHierarchy() {
        RcdoHierarchyResponse response = rcdoService.getHierarchy(orgId);

        assertThat(response.rallyCries()).hasSize(1);

        RcdoHierarchyResponse.RallyCryNode rc = response.rallyCries().get(0);
        assertThat(rc.title()).isEqualTo("Revenue Growth");
        assertThat(rc.definingObjectives()).hasSize(1); // inactive filtered out
        assertThat(rc.definingObjectives().get(0).title()).isEqualTo("Launch Enterprise");
        assertThat(rc.definingObjectives().get(0).outcomes()).hasSize(2);
    }

    @Test
    @DisplayName("filters out inactive outcomes")
    void filtersInactiveOutcomes() {
        // Add an inactive outcome to the existing hierarchy
        RallyCry rc = rallyCryRepository.findByOrgIdAndActiveTrue(orgId).get(0);
        DefiningObjective d = rc.getDefiningObjectives().stream()
                .filter(DefiningObjective::isActive).findFirst().orElseThrow();

        Outcome inactiveOutcome = new Outcome();
        inactiveOutcome.setDefiningObjective(d);
        inactiveOutcome.setTitle("Dead Outcome");
        inactiveOutcome.setActive(false);
        d.getOutcomes().add(inactiveOutcome);
        rallyCryRepository.save(rc);

        RcdoHierarchyResponse response = rcdoService.getHierarchy(orgId);

        assertThat(response.rallyCries().get(0).definingObjectives().get(0).outcomes())
                .hasSize(2) // only the 2 active ones
                .noneMatch(o -> o.title().equals("Dead Outcome"));
    }

    @Test
    @DisplayName("returns empty list for unknown org")
    void emptyForUnknownOrg() {
        RcdoHierarchyResponse response = rcdoService.getHierarchy(UUID.randomUUID());

        assertThat(response.rallyCries()).isEmpty();
    }

    @Test
    @DisplayName("excludes inactive rally cries")
    void excludesInactiveRallyCry() {
        RallyCry inactive = new RallyCry();
        inactive.setOrgId(orgId);
        inactive.setTitle("Old RC");
        inactive.setActive(false);
        rallyCryRepository.save(inactive);

        RcdoHierarchyResponse response = rcdoService.getHierarchy(orgId);

        assertThat(response.rallyCries()).hasSize(1)
                .noneMatch(rc -> rc.title().equals("Old RC"));
    }
}
