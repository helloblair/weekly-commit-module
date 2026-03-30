package com.pa.weeklycommit.exception;

import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.statemachine.StateTransition;

public class IllegalTransitionException extends RuntimeException {

    private final PlanStatus currentStatus;
    private final StateTransition attemptedTransition;

    public IllegalTransitionException(String message) {
        super(message);
        this.currentStatus = null;
        this.attemptedTransition = null;
    }

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
