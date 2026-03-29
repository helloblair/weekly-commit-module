package com.pa.weeklycommit.dto;

import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CommitResponse(
        UUID id,
        UUID planId,
        String title,
        String description,
        ChessCategory chessCategory,
        Integer priorityRank,
        CompletionStatus completionStatus,
        String actualOutcome,
        String blockerNotes,
        UUID carriedFromId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<RcdoLinkResponse> rcdoLinks
) {
    public record RcdoLinkResponse(
            UUID id,
            UUID rallyCryId,
            String rallyCryTitle,
            UUID definingObjectiveId,
            String definingObjectiveTitle,
            UUID outcomeId,
            String outcomeTitle
    ) {}
}
