package com.pa.weeklycommit.statemachine;

import com.pa.weeklycommit.model.PlanStatus;

import java.time.OffsetDateTime;

public sealed interface TransitionResult {

    record Success(PlanStatus newStatus, OffsetDateTime timestamp) implements TransitionResult {}

    record Failure(String reason) implements TransitionResult {}
}
