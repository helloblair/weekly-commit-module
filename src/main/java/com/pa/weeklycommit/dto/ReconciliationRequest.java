package com.pa.weeklycommit.dto;

import com.pa.weeklycommit.model.CompletionStatus;

import java.util.List;
import java.util.UUID;

public record ReconciliationRequest(
        List<CommitReconciliation> commits
) {
    public record CommitReconciliation(
            UUID commitId,
            CompletionStatus completionStatus,
            String actualOutcome,
            String blockerNotes,
            boolean carryForward
    ) {}
}
