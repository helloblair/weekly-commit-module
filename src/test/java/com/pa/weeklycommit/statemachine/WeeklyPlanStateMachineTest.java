package com.pa.weeklycommit.statemachine;

import com.pa.weeklycommit.entity.CommitRcdoLink;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WeeklyPlanStateMachineTest {

    private WeeklyPlanStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new WeeklyPlanStateMachine();
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static WeeklyPlan planWithStatus(PlanStatus status) {
        WeeklyPlan plan = new WeeklyPlan();
        plan.setStatus(status);
        return plan;
    }

    private static WeeklyCommit validCommitForLock(String title) {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setTitle(title);
        commit.setChessCategory(ChessCategory.QUEEN);
        commit.setRcdoLinks(List.of(new CommitRcdoLink()));
        return commit;
    }

    private static WeeklyCommit validCommitForReconciliation(String title) {
        WeeklyCommit commit = validCommitForLock(title);
        commit.setCompletionStatus(CompletionStatus.COMPLETED);
        commit.setActualOutcome("Delivered on time");
        return commit;
    }

    // ── happy paths ─────────────────────────────────────────────────────

    @Nested
    class HappyPaths {

        @Test
        void draftToLocked() {
            WeeklyPlan plan = planWithStatus(PlanStatus.DRAFT);
            List<WeeklyCommit> commits = List.of(validCommitForLock("Ship API"));

            TransitionResult result = stateMachine.transition(plan, StateTransition.LOCK, commits);

            assertThat(result).isInstanceOf(TransitionResult.Success.class);
            TransitionResult.Success success = (TransitionResult.Success) result;
            assertThat(success.newStatus()).isEqualTo(PlanStatus.LOCKED);
            assertThat(success.timestamp()).isNotNull();
        }

        @Test
        void lockedToReconciling() {
            WeeklyPlan plan = planWithStatus(PlanStatus.LOCKED);
            List<WeeklyCommit> commits = List.of(validCommitForLock("Ship API"));

            TransitionResult result = stateMachine.transition(plan, StateTransition.BEGIN_RECONCILIATION, commits);

            assertThat(result).isInstanceOf(TransitionResult.Success.class);
            TransitionResult.Success success = (TransitionResult.Success) result;
            assertThat(success.newStatus()).isEqualTo(PlanStatus.RECONCILING);
            assertThat(success.timestamp()).isNotNull();
        }

        @Test
        void reconcilingToReconciled() {
            WeeklyPlan plan = planWithStatus(PlanStatus.RECONCILING);
            List<WeeklyCommit> commits = List.of(validCommitForReconciliation("Ship API"));

            TransitionResult result = stateMachine.transition(plan, StateTransition.COMPLETE_RECONCILIATION, commits);

            assertThat(result).isInstanceOf(TransitionResult.Success.class);
            TransitionResult.Success success = (TransitionResult.Success) result;
            assertThat(success.newStatus()).isEqualTo(PlanStatus.RECONCILED);
            assertThat(success.timestamp()).isNotNull();
        }
    }

    // ── precondition rejections ─────────────────────────────────────────

    @Nested
    class PreconditionRejections {

        @Test
        void rejectLockWhenMissingRcdoLinks() {
            WeeklyCommit commit = new WeeklyCommit();
            commit.setTitle("No links");
            commit.setChessCategory(ChessCategory.ROOK);
            commit.setRcdoLinks(List.of());

            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT), StateTransition.LOCK, List.of(commit));

            assertThat(result).isInstanceOf(TransitionResult.Failure.class);
            assertThat(((TransitionResult.Failure) result).reason()).contains("RCDO link");
        }

        @Test
        void rejectLockWhenMissingChessCategory() {
            WeeklyCommit commit = new WeeklyCommit();
            commit.setTitle("No category");
            commit.setRcdoLinks(List.of(new CommitRcdoLink()));
            // chessCategory intentionally null

            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT), StateTransition.LOCK, List.of(commit));

            assertThat(result).isInstanceOf(TransitionResult.Failure.class);
            assertThat(((TransitionResult.Failure) result).reason()).contains("chess category");
        }

        @Test
        void rejectReconcileWhenMissingCompletionStatus() {
            WeeklyCommit commit = validCommitForLock("Incomplete");
            commit.setActualOutcome("Done");
            // completionStatus intentionally null

            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.RECONCILING), StateTransition.COMPLETE_RECONCILIATION, List.of(commit));

            assertThat(result).isInstanceOf(TransitionResult.Failure.class);
            assertThat(((TransitionResult.Failure) result).reason()).contains("completion status");
        }

        @Test
        void rejectReconcileWhenMissingActualOutcome() {
            WeeklyCommit commit = validCommitForLock("No outcome");
            commit.setCompletionStatus(CompletionStatus.COMPLETED);
            // actualOutcome intentionally null

            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.RECONCILING), StateTransition.COMPLETE_RECONCILIATION, List.of(commit));

            assertThat(result).isInstanceOf(TransitionResult.Failure.class);
            assertThat(((TransitionResult.Failure) result).reason()).contains("actual outcome");
        }
    }

    // ── illegal transitions ─────────────────────────────────────────────

    @Nested
    class IllegalTransitions {

        @Test
        void draftToReconciling() {
            assertThatThrownBy(() -> stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT),
                    StateTransition.BEGIN_RECONCILIATION,
                    List.of()))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        void lockedToReconciled() {
            assertThatThrownBy(() -> stateMachine.transition(
                    planWithStatus(PlanStatus.LOCKED),
                    StateTransition.COMPLETE_RECONCILIATION,
                    List.of()))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("LOCKED");
        }

        @Test
        void reconciledToAnything() {
            for (StateTransition event : StateTransition.values()) {
                assertThatThrownBy(() -> stateMachine.transition(
                        planWithStatus(PlanStatus.RECONCILED),
                        event,
                        List.of()))
                        .isInstanceOf(IllegalTransitionException.class)
                        .hasMessageContaining("RECONCILED");
            }
        }

        @Test
        void draftToDraft() {
            // There is no "stay in DRAFT" event — any non-LOCK event from DRAFT is illegal
            assertThatThrownBy(() -> stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT),
                    StateTransition.COMPLETE_RECONCILIATION,
                    List.of()))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("DRAFT → RECONCILED via COMPLETE_RECONCILIATION should throw IllegalTransitionException")
        void draftToReconciled() {
            assertThatThrownBy(() -> stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT),
                    StateTransition.COMPLETE_RECONCILIATION,
                    List.of(validCommitForReconciliation("Won't happen"))))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("LOCKED → LOCKED via LOCK should throw IllegalTransitionException")
        void lockedToLocked() {
            assertThatThrownBy(() -> stateMachine.transition(
                    planWithStatus(PlanStatus.LOCKED),
                    StateTransition.LOCK,
                    List.of(validCommitForLock("Already locked"))))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("LOCKED");
        }

        @Test
        @DisplayName("RECONCILING → LOCKED via LOCK should throw IllegalTransitionException")
        void reconcilingToLocked() {
            assertThatThrownBy(() -> stateMachine.transition(
                    planWithStatus(PlanStatus.RECONCILING),
                    StateTransition.LOCK,
                    List.of(validCommitForLock("Can't go back"))))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("RECONCILING");
        }
    }

    // ── edge cases ──────────────────────────────────────────────────────

    @Nested
    class EdgeCases {

        @Test
        void emptyCommitListOnLock() {
            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT), StateTransition.LOCK, List.of());

            assertThat(result).isInstanceOf(TransitionResult.Failure.class);
            assertThat(((TransitionResult.Failure) result).reason()).contains("no commits");
        }

        @Test
        @DisplayName("Single valid commit should lock successfully")
        void singleValidCommitLocks() {
            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT),
                    StateTransition.LOCK,
                    List.of(validCommitForLock("Solo commit")));

            assertThat(result).isInstanceOf(TransitionResult.Success.class);
            TransitionResult.Success success = (TransitionResult.Success) result;
            assertThat(success.newStatus()).isEqualTo(PlanStatus.LOCKED);
            assertThat(success.timestamp()).isNotNull();
        }

        @Test
        @DisplayName("100 valid commits should lock successfully")
        void hundredValidCommitsLock() {
            List<WeeklyCommit> commits = IntStream.rangeClosed(1, 100)
                    .mapToObj(i -> validCommitForLock("Commit #" + i))
                    .toList();

            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT), StateTransition.LOCK, commits);

            assertThat(result).isInstanceOf(TransitionResult.Success.class);
            TransitionResult.Success success = (TransitionResult.Success) result;
            assertThat(success.newStatus()).isEqualTo(PlanStatus.LOCKED);
        }

        @Test
        @DisplayName("100 commits where exactly one is missing chess category should fail")
        void hundredCommitsOneMissingChessCategory() {
            List<WeeklyCommit> commits = new ArrayList<>(IntStream.rangeClosed(1, 99)
                    .mapToObj(i -> validCommitForLock("Valid #" + i))
                    .toList());

            WeeklyCommit bad = new WeeklyCommit();
            bad.setTitle("The bad one");
            bad.setRcdoLinks(List.of(new CommitRcdoLink()));
            // chessCategory intentionally null
            commits.add(bad);

            TransitionResult result = stateMachine.transition(
                    planWithStatus(PlanStatus.DRAFT), StateTransition.LOCK, commits);

            assertThat(result).isInstanceOf(TransitionResult.Failure.class);
            assertThat(((TransitionResult.Failure) result).reason()).contains("chess category");
        }
    }
}
