package com.pa.weeklycommit.statemachine;

import com.pa.weeklycommit.model.PlanStatus;

public class IllegalTransitionException extends RuntimeException {

    private final PlanStatus currentStatus;
    private final StateTransition attemptedTransition;

    public IllegalTransitionException(PlanStatus currentStatus, StateTransition attemptedTransition) {
        super("Illegal transition: cannot apply %s from %s".formatted(attemptedTransition, currentStatus));
        this.currentStatus = currentStatus;
        this.attemptedTransition = attemptedTransition;
    }

    public PlanStatus getCurrentStatus() {
        return currentStatus;
    }

    public StateTransition getAttemptedTransition() {
        return attemptedTransition;
    }
}
