package com.pa.weeklycommit.service;

import com.pa.weeklycommit.TestcontainersConfig;
import com.pa.weeklycommit.dto.PlanResponse;
import com.pa.weeklycommit.dto.ReconciliationRequest;
import com.pa.weeklycommit.entity.CommitRcdoLink;
import com.pa.weeklycommit.entity.DefiningObjective;
import com.pa.weeklycommit.entity.Outcome;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.repository.CommitSnapshotRepository;
import com.pa.weeklycommit.repository.RallyCryRepository;
import com.pa.weeklycommit.repository.WeeklyCommitRepository;
import com.pa.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class WeeklyPlanServiceTest extends TestcontainersConfig {

    @Autowired WeeklyPlanService planService;
    @Autowired WeeklyPlanRepository planRepository;
    @Autowired WeeklyCommitRepository commitRepository;
    @Autowired CommitSnapshotRepository snapshotRepository;
    @Autowired RallyCryRepository rallyCryRepository;

    static final UUID USER_ID = UUID.randomUUID();
    static final LocalDate MONDAY = LocalDate.of(2026, 4, 6); // a Monday

    private RallyCry rallyCry;
    private DefiningObjective defObj;
    private Outcome outcome;

    @BeforeEach
    void seedRcdo() {
        // Create a minimal RCDO hierarchy for tests that need it
        rallyCry = new RallyCry();
        rallyCry.setOrgId(UUID.randomUUID());
        rallyCry.setTitle("Test Rally Cry");
        rallyCry = rallyCryRepository.save(rallyCry);

        defObj = new DefiningObjective();
        defObj.setRallyCry(rallyCry);
        defObj.setTitle("Test Objective");
        rallyCry.getDefiningObjectives().add(defObj);

        outcome = new Outcome();
        outcome.setDefiningObjective(defObj);
        outcome.setTitle("Test Outcome");
        defObj.getOutcomes().add(outcome);

        rallyCryRepository.save(rallyCry);
        // Refresh to get generated IDs on nested entities
        defObj = rallyCry.getDefiningObjectives().get(0);
        outcome = defObj.getOutcomes().get(0);
    }

    private WeeklyCommit addCommitToPlan(WeeklyPlan plan, String title) {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setPlan(plan);
        commit.setTitle(title);
        commit.setChessCategory(ChessCategory.QUEEN);

        CommitRcdoLink link = new CommitRcdoLink();
        link.setCommit(commit);
        link.setRallyCry(rallyCry);
        link.setDefiningObjective(defObj);
        link.setOutcome(outcome);
        commit.getRcdoLinks().add(link);

        return commitRepository.save(commit);
    }

    // ── getOrCreatePlan ─────────────────────────────────────────────

    @Nested
    class GetOrCreatePlan {

        @Test
        @DisplayName("creates a DRAFT plan when none exists")
        void createsNewPlan() {
            PlanResponse response = planService.getOrCreatePlan(USER_ID, MONDAY);

            assertThat(response.id()).isNotNull();
            assertThat(response.userId()).isEqualTo(USER_ID);
            assertThat(response.weekOf()).isEqualTo(MONDAY);
            assertThat(response.status()).isEqualTo(PlanStatus.DRAFT);
            assertThat(response.commits()).isEmpty();
        }

        @Test
        @DisplayName("returns existing plan on second call")
        void returnsExistingPlan() {
            PlanResponse first = planService.getOrCreatePlan(USER_ID, MONDAY);
            PlanResponse second = planService.getOrCreatePlan(USER_ID, MONDAY);

            assertThat(second.id()).isEqualTo(first.id());
        }

        @Test
        @DisplayName("rejects non-Monday weekOf")
        void rejectsNonMonday() {
            LocalDate tuesday = MONDAY.plusDays(1);
            assertThatThrownBy(() -> planService.getOrCreatePlan(USER_ID, tuesday))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Monday");
        }
    }

    // ── lockPlan ────────────────────────────────────────────────────

    @Nested
    class LockPlan {

        @Test
        @DisplayName("locks a DRAFT plan and creates snapshots")
        void locksDraftPlan() {
            PlanResponse plan = planService.getOrCreatePlan(USER_ID, MONDAY);
            WeeklyPlan entity = planRepository.findById(plan.id()).orElseThrow();
            addCommitToPlan(entity, "Ship feature");

            PlanResponse locked = planService.lockPlan(plan.id());

            assertThat(locked.status()).isEqualTo(PlanStatus.LOCKED);
            assertThat(locked.lockedAt()).isNotNull();
            // Verify snapshots were created for our commit
            List<WeeklyCommit> commits = commitRepository.findByPlanId(plan.id());
            assertThat(commits).isNotEmpty();
            assertThat(snapshotRepository.findByCommitId(commits.get(0).getId()))
                    .isNotEmpty()
                    .allSatisfy(snap -> assertThat(snap.getTitle()).isEqualTo("Ship feature"));
        }

        @Test
        @DisplayName("rejects locking an already LOCKED plan")
        void rejectsLockingLockedPlan() {
            PlanResponse plan = planService.getOrCreatePlan(USER_ID, MONDAY);
            WeeklyPlan entity = planRepository.findById(plan.id()).orElseThrow();
            addCommitToPlan(entity, "Commit");
            planService.lockPlan(plan.id());

            assertThatThrownBy(() -> planService.lockPlan(plan.id()))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("LOCKED");
        }

        @Test
        @DisplayName("throws EntityNotFoundException for nonexistent plan")
        void throwsOnMissingPlan() {
            assertThatThrownBy(() -> planService.lockPlan(UUID.randomUUID()))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ── startReconciliation ─────────────────────────────────────────

    @Nested
    class StartReconciliation {

        @Test
        @DisplayName("transitions LOCKED plan to RECONCILING")
        void startsReconciliation() {
            PlanResponse plan = planService.getOrCreatePlan(USER_ID, MONDAY);
            WeeklyPlan entity = planRepository.findById(plan.id()).orElseThrow();
            addCommitToPlan(entity, "Commit");
            planService.lockPlan(plan.id());

            PlanResponse reconciling = planService.startReconciliation(plan.id());

            assertThat(reconciling.status()).isEqualTo(PlanStatus.RECONCILING);
            assertThat(reconciling.reconciliationStartedAt()).isNotNull();
        }

        @Test
        @DisplayName("rejects starting reconciliation from DRAFT")
        void rejectsFromDraft() {
            PlanResponse plan = planService.getOrCreatePlan(USER_ID, MONDAY);

            assertThatThrownBy(() -> planService.startReconciliation(plan.id()))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("DRAFT");
        }
    }

    // ── completeReconciliation ──────────────────────────────────────

    @Nested
    class CompleteReconciliation {

        private UUID setupReconcilingPlan() {
            PlanResponse plan = planService.getOrCreatePlan(USER_ID, MONDAY);
            WeeklyPlan entity = planRepository.findById(plan.id()).orElseThrow();
            addCommitToPlan(entity, "Commit A");
            planService.lockPlan(plan.id());
            planService.startReconciliation(plan.id());
            return plan.id();
        }

        @Test
        @DisplayName("completes reconciliation and sets RECONCILED")
        void completesReconciliation() {
            UUID planId = setupReconcilingPlan();
            List<WeeklyCommit> commits = commitRepository.findByPlanId(planId);
            UUID commitId = commits.get(0).getId();

            ReconciliationRequest request = new ReconciliationRequest(List.of(
                    new ReconciliationRequest.CommitReconciliation(
                            commitId, CompletionStatus.COMPLETED, "Done", null, false)
            ));

            PlanResponse reconciled = planService.completeReconciliation(planId, request);

            assertThat(reconciled.status()).isEqualTo(PlanStatus.RECONCILED);
            assertThat(reconciled.reconciledAt()).isNotNull();
        }

        @Test
        @DisplayName("carry-forward clones commit to next week's plan")
        void carryForwardCreatesNextWeekCommit() {
            UUID planId = setupReconcilingPlan();
            List<WeeklyCommit> commits = commitRepository.findByPlanId(planId);
            UUID commitId = commits.get(0).getId();

            ReconciliationRequest request = new ReconciliationRequest(List.of(
                    new ReconciliationRequest.CommitReconciliation(
                            commitId, CompletionStatus.PARTIAL, "Halfway", null, true)
            ));

            planService.completeReconciliation(planId, request);

            // Next Monday's plan should exist with a carried commit
            LocalDate nextMonday = MONDAY.plusWeeks(1);
            WeeklyPlan nextPlan = planRepository.findByUserIdAndWeekOf(USER_ID, nextMonday)
                    .orElseThrow(() -> new AssertionError("Next week's plan not created"));

            assertThat(nextPlan.getStatus()).isEqualTo(PlanStatus.DRAFT);

            List<WeeklyCommit> carriedCommits = commitRepository.findByPlanId(nextPlan.getId());
            assertThat(carriedCommits).hasSize(1);

            WeeklyCommit carried = carriedCommits.get(0);
            assertThat(carried.getTitle()).isEqualTo("Commit A");
            assertThat(carried.getCarriedFromId()).isEqualTo(commitId);
            assertThat(carried.getChessCategory()).isNull();
            assertThat(carried.getPriorityRank()).isNull();
        }

        @Test
        @DisplayName("carry-forward copies RCDO links to the new commit")
        void carryForwardCopiesRcdoLinks() {
            UUID planId = setupReconcilingPlan();
            List<WeeklyCommit> commits = commitRepository.findByPlanId(planId);
            UUID commitId = commits.get(0).getId();

            ReconciliationRequest request = new ReconciliationRequest(List.of(
                    new ReconciliationRequest.CommitReconciliation(
                            commitId, CompletionStatus.BLOCKED, "Blocked", "External dep", true)
            ));

            planService.completeReconciliation(planId, request);

            LocalDate nextMonday = MONDAY.plusWeeks(1);
            WeeklyPlan nextPlan = planRepository.findByUserIdAndWeekOf(USER_ID, nextMonday).orElseThrow();
            List<WeeklyCommit> carriedCommits = commitRepository.findByPlanId(nextPlan.getId());
            WeeklyCommit carried = carriedCommits.get(0);

            assertThat(carried.getRcdoLinks()).hasSize(1);
            CommitRcdoLink link = carried.getRcdoLinks().get(0);
            assertThat(link.getRallyCry().getId()).isEqualTo(rallyCry.getId());
            assertThat(link.getDefiningObjective().getId()).isEqualTo(defObj.getId());
            assertThat(link.getOutcome().getId()).isEqualTo(outcome.getId());
        }

        @Test
        @DisplayName("no carry-forward when flag is false")
        void noCarryForwardWhenFlagFalse() {
            UUID planId = setupReconcilingPlan();
            List<WeeklyCommit> commits = commitRepository.findByPlanId(planId);
            UUID commitId = commits.get(0).getId();

            ReconciliationRequest request = new ReconciliationRequest(List.of(
                    new ReconciliationRequest.CommitReconciliation(
                            commitId, CompletionStatus.COMPLETED, "All done", null, false)
            ));

            planService.completeReconciliation(planId, request);

            LocalDate nextMonday = MONDAY.plusWeeks(1);
            assertThat(planRepository.findByUserIdAndWeekOf(USER_ID, nextMonday)).isEmpty();
        }

        @Test
        @DisplayName("rejects completing reconciliation from DRAFT")
        void rejectsFromDraft() {
            PlanResponse plan = planService.getOrCreatePlan(USER_ID, MONDAY);

            ReconciliationRequest request = new ReconciliationRequest(List.of());

            assertThatThrownBy(() -> planService.completeReconciliation(plan.id(), request))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("DRAFT");
        }
    }
}
