package com.pa.weeklycommit.dto;

import com.pa.weeklycommit.model.CompletionStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RcdoCoverageResponse(
        LocalDate weekOf,
        List<RallyCryCoverage> rallyCries
) {
    public record RallyCryCoverage(
            UUID id,
            String title,
            boolean covered,
            List<DefiningObjectiveCoverage> definingObjectives
    ) {}

    public record DefiningObjectiveCoverage(
            UUID id,
            String title,
            boolean covered,
            List<OutcomeCoverage> outcomes
    ) {}

    public record OutcomeCoverage(
            UUID id,
            String title,
            boolean covered,
            double completionRate,
            List<CommitRef> commits
    ) {}

    public record CommitRef(
            UUID commitId,
            UUID userId,
            String memberName,
            String commitTitle,
            CompletionStatus completionStatus
    ) {}
}
