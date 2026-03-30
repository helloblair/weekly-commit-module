package com.pa.weeklycommit.service;

import com.pa.weeklycommit.dto.CommitCreateRequest;
import com.pa.weeklycommit.dto.CommitUpdateRequest;
import com.pa.weeklycommit.dto.RcdoLinkRequest;
import com.pa.weeklycommit.dto.RcdoLinkResponse;
import com.pa.weeklycommit.dto.WeeklyCommitResponse;
import com.pa.weeklycommit.entity.CommitRcdoLink;
import com.pa.weeklycommit.entity.DefiningObjective;
import com.pa.weeklycommit.entity.Outcome;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.repository.DefiningObjectiveRepository;
import com.pa.weeklycommit.repository.OutcomeRepository;
import com.pa.weeklycommit.repository.RallyCryRepository;
import com.pa.weeklycommit.repository.WeeklyCommitRepository;
import com.pa.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class WeeklyCommitService {

    private final WeeklyCommitRepository commitRepository;
    private final WeeklyPlanRepository planRepository;
    private final RallyCryRepository rallyCryRepository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final OutcomeRepository outcomeRepository;

    public WeeklyCommitService(WeeklyCommitRepository commitRepository,
                               WeeklyPlanRepository planRepository,
                               RallyCryRepository rallyCryRepository,
                               DefiningObjectiveRepository definingObjectiveRepository,
                               OutcomeRepository outcomeRepository) {
        this.commitRepository = commitRepository;
        this.planRepository = planRepository;
        this.rallyCryRepository = rallyCryRepository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.outcomeRepository = outcomeRepository;
    }

    @Transactional(readOnly = true)
    public List<WeeklyCommitResponse> getCommitsByPlan(UUID planId) {
        return commitRepository.findByPlanIdOrderByPriorityRankAsc(planId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public WeeklyCommitResponse createCommit(UUID planId, CommitCreateRequest request) {
        WeeklyPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Plan not found: " + planId));

        validateDraftStatus(plan);

        WeeklyCommit commit = new WeeklyCommit();
        commit.setPlan(plan);
        commit.setTitle(request.title());
        commit.setDescription(request.description());

        commit = commitRepository.save(commit);

        syncRcdoLinks(commit, request.rcdoLinks());

        return toResponse(commit);
    }

    @Transactional
    public WeeklyCommitResponse updateCommit(UUID commitId, CommitUpdateRequest request) {
        WeeklyCommit commit = commitRepository.findById(commitId)
                .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));

        validateDraftStatus(commit.getPlan());

        if (request.title() != null) {
            commit.setTitle(request.title());
        }
        if (request.description() != null) {
            commit.setDescription(request.description());
        }
        if (request.chessCategory() != null) {
            if ("NONE".equals(request.chessCategory())) {
                commit.setChessCategory(null);
                commit.setPriorityRank(null);
            } else {
                commit.setChessCategory(ChessCategory.valueOf(request.chessCategory()));
            }
        }
        if (request.priorityRank() != null) {
            commit.setPriorityRank(request.priorityRank());
        }
        if (request.rcdoLinks() != null) {
            syncRcdoLinks(commit, request.rcdoLinks());
        }

        return toResponse(commitRepository.save(commit));
    }

    @Transactional
    public void deleteCommit(UUID commitId) {
        WeeklyCommit commit = commitRepository.findById(commitId)
                .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));

        validateDraftStatus(commit.getPlan());

        commit.setDeletedAt(OffsetDateTime.now());
        commitRepository.save(commit);
    }

    private void validateDraftStatus(WeeklyPlan plan) {
        if (plan.getStatus() != PlanStatus.DRAFT) {
            throw new IllegalTransitionException(
                    "Plan must be in DRAFT status to modify commits, current status: " + plan.getStatus());
        }
    }

    private void syncRcdoLinks(WeeklyCommit commit, List<RcdoLinkRequest> linkRequests) {
        commit.getRcdoLinks().clear();

        for (RcdoLinkRequest lr : linkRequests) {
            RallyCry rallyCry = rallyCryRepository.findById(lr.rallyCryId())
                    .orElseThrow(() -> new EntityNotFoundException("RallyCry not found: " + lr.rallyCryId()));
            DefiningObjective defObj = definingObjectiveRepository.findById(lr.definingObjectiveId())
                    .orElseThrow(() -> new EntityNotFoundException("DefiningObjective not found: " + lr.definingObjectiveId()));
            Outcome outcome = outcomeRepository.findById(lr.outcomeId())
                    .orElseThrow(() -> new EntityNotFoundException("Outcome not found: " + lr.outcomeId()));

            CommitRcdoLink link = new CommitRcdoLink();
            link.setCommit(commit);
            link.setRallyCry(rallyCry);
            link.setDefiningObjective(defObj);
            link.setOutcome(outcome);
            commit.getRcdoLinks().add(link);
        }
    }

    WeeklyCommitResponse toResponse(WeeklyCommit commit) {
        List<RcdoLinkResponse> links = commit.getRcdoLinks().stream()
                .map(link -> new RcdoLinkResponse(
                        link.getRallyCry().getId(),
                        link.getRallyCry().getTitle(),
                        link.getDefiningObjective().getId(),
                        link.getDefiningObjective().getTitle(),
                        link.getOutcome().getId(),
                        link.getOutcome().getTitle()
                ))
                .toList();

        return new WeeklyCommitResponse(
                commit.getId(),
                commit.getPlan().getId(),
                commit.getTitle(),
                commit.getDescription(),
                commit.getChessCategory() != null ? commit.getChessCategory().name() : null,
                commit.getPriorityRank(),
                commit.getActualOutcome(),
                commit.getCompletionStatus() != null ? commit.getCompletionStatus().name() : null,
                commit.getBlockerNotes(),
                commit.getCarriedFromId(),
                links
        );
    }
}
