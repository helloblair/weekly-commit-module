package com.pa.weeklycommit.dto;

import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CommitRequest(
        UUID userId,
        LocalDate weekOf,
        String title,
        String description,
        ChessCategory chessCategory,
        Integer priorityRank,
        CompletionStatus completionStatus,
        String actualOutcome,
        String blockerNotes,
        List<RcdoLinkRequest> rcdoLinks
) {
    public record RcdoLinkRequest(
            UUID rallyCryId,
            UUID definingObjectiveId,
            UUID outcomeId
    ) {}
}
