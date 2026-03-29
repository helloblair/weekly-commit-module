package com.pa.weeklycommit.dto;

import java.util.List;
import java.util.UUID;

public record WeeklyCommitResponse(
        UUID id,
        UUID planId,
        String title,
        String description,
        String chessCategory,
        Integer priorityRank,
        String actualOutcome,
        String completionStatus,
        String blockerNotes,
        UUID carriedFromId,
        List<RcdoLinkResponse> rcdoLinks
) {}
