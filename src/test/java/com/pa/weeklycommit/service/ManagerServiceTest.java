package com.pa.weeklycommit.service;

import com.pa.weeklycommit.TestcontainersConfig;
import com.pa.weeklycommit.dto.RcdoCoverageResponse;
import com.pa.weeklycommit.dto.TeamRollupResponse;
import com.pa.weeklycommit.entity.CommitRcdoLink;
import com.pa.weeklycommit.entity.DefiningObjective;
import com.pa.weeklycommit.entity.Outcome;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.entity.TeamMember;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.repository.RallyCryRepository;
import com.pa.weeklycommit.repository.TeamMemberRepository;
import com.pa.weeklycommit.repository.WeeklyCommitRepository;
import com.pa.weeklycommit.repository.WeeklyPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ManagerServiceTest extends TestcontainersConfig {

    @Autowired ManagerService managerService;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired WeeklyPlanRepository planRepository;
    @Autowired WeeklyCommitRepository commitRepository;
    @Autowired RallyCryRepository rallyCryRepository;

    static final UUID MANAGER_ID = UUID.randomUUID();
    static final LocalDate MONDAY = LocalDate.of(2026, 4, 6);

    private UUID memberId;
    private UUID orgId;
    private RallyCry rallyCry;
    private DefiningObjective defObj;
    private Outcome outcome;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        memberId = UUID.randomUUID();

        // TeamMember — need setters, use reflection since entity has no setters
        TeamMember tm = new TeamMember();
        ReflectionTestUtils.setField(tm, "managerId", MANAGER_ID);
        ReflectionTestUtils.setField(tm, "memberId", memberId);
        ReflectionTestUtils.setField(tm, "displayName", "Alice");
        teamMemberRepository.save(tm);

        // RCDO
        rallyCry = new RallyCry();
        rallyCry.setOrgId(orgId);
        rallyCry.setTitle("Growth");

        defObj = new DefiningObjective();
        defObj.setRallyCry(rallyCry);
        defObj.setTitle("Enterprise");
        rallyCry.getDefiningObjectives().add(defObj);

        outcome = new Outcome();
        outcome.setDefiningObjective(defObj);
        outcome.setTitle("SSO");
        defObj.getOutcomes().add(outcome);

        rallyCryRepository.save(rallyCry);
        defObj = rallyCry.getDefiningObjectives().get(0);
        outcome = defObj.getOutcomes().get(0);
    }

    private WeeklyPlan createPlanWithCommit(PlanStatus status, CompletionStatus completion) {
        WeeklyPlan plan = new WeeklyPlan();
        plan.setUserId(memberId);
        plan.setWeekOf(MONDAY);
        plan.setStatus(status);
        plan = planRepository.save(plan);

        WeeklyCommit commit = new WeeklyCommit();
        commit.setPlan(plan);
        commit.setTitle("Build SSO");
        commit.setChessCategory(ChessCategory.KING);
        if (completion != null) {
            commit.setCompletionStatus(completion);
            commit.setActualOutcome("Done");
        }

        CommitRcdoLink link = new CommitRcdoLink();
        link.setCommit(commit);
        link.setRallyCry(rallyCry);
        link.setDefiningObjective(defObj);
        link.setOutcome(outcome);
        commit.getRcdoLinks().add(link);

        plan.getCommits().add(commit);
        planRepository.save(plan);
        return plan;
    }

    // ── getTeamRollup ───────────────────────────────────────────────

    @Nested
    class GetTeamRollup {

        @Test
        @DisplayName("returns team member summaries with commits")
        void returnsTeamRollup() {
            createPlanWithCommit(PlanStatus.LOCKED, null);

            TeamRollupResponse response = managerService.getTeamRollup(MANAGER_ID, MONDAY);

            assertThat(response.weekOf()).isEqualTo(MONDAY);
            assertThat(response.teamMembers()).hasSize(1);

            TeamRollupResponse.TeamMemberSummary member = response.teamMembers().get(0);
            assertThat(member.name()).isEqualTo("Alice");
            assertThat(member.planStatus()).isEqualTo(PlanStatus.LOCKED);
            assertThat(member.commits()).hasSize(1);
            assertThat(member.commits().get(0).title()).isEqualTo("Build SSO");
            assertThat(member.commits().get(0).rcdoPath()).contains("Growth");
        }

        @Test
        @DisplayName("returns DRAFT status when member has no plan")
        void defaultsDraftWhenNoPlan() {
            // No plan created — just the team member exists
            TeamRollupResponse response = managerService.getTeamRollup(MANAGER_ID, MONDAY);

            assertThat(response.teamMembers()).hasSize(1);
            assertThat(response.teamMembers().get(0).planStatus()).isEqualTo(PlanStatus.DRAFT);
            assertThat(response.teamMembers().get(0).commits()).isEmpty();
        }

        @Test
        @DisplayName("calculates completion stats correctly")
        void calculatesStats() {
            createPlanWithCommit(PlanStatus.RECONCILED, CompletionStatus.COMPLETED);

            TeamRollupResponse response = managerService.getTeamRollup(MANAGER_ID, MONDAY);
            TeamRollupResponse.CompletionStats stats = response.teamMembers().get(0).stats();

            assertThat(stats.total()).isEqualTo(1);
            assertThat(stats.completed()).isEqualTo(1);
            assertThat(stats.partial()).isZero();
            assertThat(stats.blocked()).isZero();
        }

        @Test
        @DisplayName("returns empty list for manager with no reports")
        void emptyForNoReports() {
            TeamRollupResponse response = managerService.getTeamRollup(UUID.randomUUID(), MONDAY);

            assertThat(response.teamMembers()).isEmpty();
        }
    }

    // ── getRcdoCoverage ─────────────────────────────────────────────

    @Nested
    class GetRcdoCoverage {

        @Test
        @DisplayName("marks outcomes as covered when commits link to them")
        void marksCoveredOutcomes() {
            createPlanWithCommit(PlanStatus.LOCKED, null);

            RcdoCoverageResponse response = managerService.getRcdoCoverage(MANAGER_ID, orgId, MONDAY);

            assertThat(response.rallyCries()).hasSize(1);
            RcdoCoverageResponse.RallyCryCoverage rc = response.rallyCries().get(0);
            assertThat(rc.covered()).isTrue();
            assertThat(rc.definingObjectives().get(0).covered()).isTrue();

            RcdoCoverageResponse.OutcomeCoverage oc = rc.definingObjectives().get(0).outcomes().get(0);
            assertThat(oc.covered()).isTrue();
            assertThat(oc.commits()).hasSize(1);
            assertThat(oc.commits().get(0).memberName()).isEqualTo("Alice");
        }

        @Test
        @DisplayName("marks outcomes as uncovered when no commits link to them")
        void marksUncoveredOutcomes() {
            // No plan/commits created — hierarchy exists but nothing linked
            RcdoCoverageResponse response = managerService.getRcdoCoverage(MANAGER_ID, orgId, MONDAY);

            assertThat(response.rallyCries()).hasSize(1);
            RcdoCoverageResponse.RallyCryCoverage rc = response.rallyCries().get(0);
            assertThat(rc.covered()).isFalse();
            assertThat(rc.definingObjectives().get(0).outcomes().get(0).covered()).isFalse();
        }

        @Test
        @DisplayName("calculates completion rate for covered outcomes")
        void calculatesCompletionRate() {
            createPlanWithCommit(PlanStatus.RECONCILED, CompletionStatus.COMPLETED);

            RcdoCoverageResponse response = managerService.getRcdoCoverage(MANAGER_ID, orgId, MONDAY);

            RcdoCoverageResponse.OutcomeCoverage oc =
                    response.rallyCries().get(0).definingObjectives().get(0).outcomes().get(0);
            assertThat(oc.completionRate()).isEqualTo(1.0);
        }
    }
}
