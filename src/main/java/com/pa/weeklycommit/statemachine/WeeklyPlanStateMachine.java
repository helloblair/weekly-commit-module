package com.pa.weeklycommit.statemachine;

import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.model.PlanStatus;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
public class WeeklyPlanStateMachine {

    public TransitionResult transition(WeeklyPlan plan, StateTransition event, List<WeeklyCommit> commits) {
        return switch (plan.getStatus()) {
            case DRAFT -> handleDraft(event, commits);
            case LOCKED -> handleLocked(event);
            case RECONCILING -> handleReconciling(event, commits);
            case RECONCILED -> throw new IllegalTransitionException(PlanStatus.RECONCILED, event);
        };
    }

    private TransitionResult handleDraft(StateTransition event, List<WeeklyCommit> commits) {
        return switch (event) {
            case LOCK -> validateAndLock(commits);
            case BEGIN_RECONCILIATION, COMPLETE_RECONCILIATION ->
                    throw new IllegalTransitionException(PlanStatus.DRAFT, event);
        };
    }

    private TransitionResult handleLocked(StateTransition event) {
        return switch (event) {
            case BEGIN_RECONCILIATION ->
                    new TransitionResult.Success(PlanStatus.RECONCILING, OffsetDateTime.now());
            case LOCK, COMPLETE_RECONCILIATION ->
                    throw new IllegalTransitionException(PlanStatus.LOCKED, event);
        };
    }

    private TransitionResult handleReconciling(StateTransition event, List<WeeklyCommit> commits) {
        return switch (event) {
            case COMPLETE_RECONCILIATION -> validateAndReconcile(commits);
            case LOCK, BEGIN_RECONCILIATION ->
                    throw new IllegalTransitionException(PlanStatus.RECONCILING, event);
        };
    }

    private TransitionResult validateAndLock(List<WeeklyCommit> commits) {
        if (commits.isEmpty()) {
            return new TransitionResult.Failure("Cannot lock a plan with no commits");
        }

        for (WeeklyCommit commit : commits) {
            if (commit.getRcdoLinks() == null || commit.getRcdoLinks().isEmpty()) {
                return new TransitionResult.Failure(
                        "Commit \"%s\" must have at least one RCDO link".formatted(commit.getTitle()));
            }
            if (commit.getChessCategory() == null) {
                return new TransitionResult.Failure(
                        "Commit \"%s\" must have a chess category".formatted(commit.getTitle()));
            }
        }

        return new TransitionResult.Success(PlanStatus.LOCKED, OffsetDateTime.now());
    }

    private TransitionResult validateAndReconcile(List<WeeklyCommit> commits) {
        for (WeeklyCommit commit : commits) {
            if (commit.getCompletionStatus() == null) {
                return new TransitionResult.Failure(
                        "Commit \"%s\" must have a completion status".formatted(commit.getTitle()));
            }
            if (commit.getActualOutcome() == null || commit.getActualOutcome().isBlank()) {
                return new TransitionResult.Failure(
                        "Commit \"%s\" must have an actual outcome".formatted(commit.getTitle()));
            }
        }

        return new TransitionResult.Success(PlanStatus.RECONCILED, OffsetDateTime.now());
    }
}
