package com.pa.weeklycommit.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RcdoLinkRequest(
        @NotNull UUID rallyCryId,
        @NotNull UUID definingObjectiveId,
        @NotNull UUID outcomeId
) {}
