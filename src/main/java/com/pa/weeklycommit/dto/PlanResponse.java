package com.pa.weeklycommit.dto;

import com.pa.weeklycommit.model.PlanStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PlanResponse(
        UUID id,
        UUID userId,
        LocalDate weekOf,
        PlanStatus status,
        OffsetDateTime lockedAt,
        OffsetDateTime reconciliationStartedAt,
        OffsetDateTime reconciledAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<WeeklyCommitResponse> commits
) {}
