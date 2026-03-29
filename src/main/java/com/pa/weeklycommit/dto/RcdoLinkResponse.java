package com.pa.weeklycommit.dto;

import java.util.UUID;

public record RcdoLinkResponse(
        UUID rallyCryId,
        String rallyCryTitle,
        UUID definingObjectiveId,
        String definingObjectiveTitle,
        UUID outcomeId,
        String outcomeTitle
) {}
