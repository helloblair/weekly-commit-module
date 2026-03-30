package com.pa.weeklycommit.dto;

import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TeamRollupResponse(
        LocalDate weekOf,
        List<TeamMemberSummary> teamMembers
) {
    public record TeamMemberSummary(
            UUID userId,
            String name,
            PlanStatus planStatus,
            List<CommitSummary> commits,
            CompletionStats stats
    ) {}

    public record CommitSummary(
            UUID id,
            String title,
            ChessCategory chessCategory,
            CompletionStatus completionStatus,
            String rcdoPath
    ) {}

    public record CompletionStats(
            int total,
            int completed,
            int partial,
            int notStarted,
            int blocked
    ) {}
}
