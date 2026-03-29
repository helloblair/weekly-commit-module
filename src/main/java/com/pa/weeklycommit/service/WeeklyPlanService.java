package com.pa.weeklycommit.service;

import com.pa.weeklycommit.dto.PlanResponse;
import com.pa.weeklycommit.dto.WeeklyCommitResponse;
import com.pa.weeklycommit.dto.ReconciliationRequest;
import com.pa.weeklycommit.entity.CommitRcdoLink;
import com.pa.weeklycommit.entity.CommitSnapshot;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.model.SnapshotType;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.repository.CommitSnapshotRepository;
import com.pa.weeklycommit.repository.WeeklyCommitRepository;
import com.pa.weeklycommit.repository.WeeklyPlanRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class WeeklyPlanService {

    private final WeeklyPlanRepository planRepository;
    private final WeeklyCommitRepository commitRepository;
    private final CommitSnapshotRepository snapshotRepository;
    private final WeeklyCommitService commitService;
    private final ObjectMapper objectMapper;

    public WeeklyPlanService(WeeklyPlanRepository planRepository,
                             WeeklyCommitRepository commitRepository,
                             CommitSnapshotRepository snapshotRepository,
                             WeeklyCommitService commitService,
                             ObjectMapper objectMapper) {
        this.planRepository = planRepository;
        this.commitRepository = commitRepository;
        this.snapshotRepository = snapshotRepository;
        this.commitService = commitService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PlanResponse getOrCreatePlan(UUID userId, LocalDate weekOf) {
        validateMonday(weekOf);

        WeeklyPlan plan = planRepository.findByUserIdAndWeekOf(userId, weekOf)
                .orElseGet(() -> {
                    WeeklyPlan newPlan = new WeeklyPlan();
                    newPlan.setUserId(userId);
                    newPlan.setWeekOf(weekOf);
                    newPlan.setStatus(PlanStatus.DRAFT);
                    return planRepository.save(newPlan);
                });

        return toResponse(plan);
    }

    @Transactional
    public PlanResponse lockPlan(UUID planId) {
        WeeklyPlan plan = findPlanOrThrow(planId);

        if (plan.getStatus() != PlanStatus.DRAFT) {
            throw new IllegalTransitionException(
                    "Can only lock a DRAFT plan, current status: " + plan.getStatus());
        }

        plan.setStatus(PlanStatus.LOCKED);
        plan.setLockedAt(OffsetDateTime.now());

        // Snapshot each commit at lock time
        List<WeeklyCommit> commits = commitRepository.findByPlanId(planId);
        for (WeeklyCommit commit : commits) {
            createSnapshot(commit, SnapshotType.LOCKED);
        }

        return toResponse(planRepository.save(plan));
    }

    @Transactional
    public PlanResponse startReconciliation(UUID planId) {
        WeeklyPlan plan = findPlanOrThrow(planId);

        if (plan.getStatus() != PlanStatus.LOCKED) {
            throw new IllegalTransitionException(
                    "Can only start reconciliation on a LOCKED plan, current status: " + plan.getStatus());
        }

        plan.setStatus(PlanStatus.RECONCILING);
        plan.setReconciliationStartedAt(OffsetDateTime.now());

        return toResponse(planRepository.save(plan));
    }

    @Transactional
    public PlanResponse completeReconciliation(UUID planId, ReconciliationRequest request) {
        WeeklyPlan plan = findPlanOrThrow(planId);

        if (plan.getStatus() != PlanStatus.RECONCILING) {
            throw new IllegalTransitionException(
                    "Can only complete reconciliation on a RECONCILING plan, current status: " + plan.getStatus());
        }

        // Apply reconciliation data to commits
        Map<UUID, WeeklyCommit> commitMap = commitRepository.findByPlanId(planId)
                .stream()
                .collect(Collectors.toMap(WeeklyCommit::getId, Function.identity()));

        LocalDate nextMonday = plan.getWeekOf().plusWeeks(1);
        WeeklyPlan nextPlan = null;

        for (ReconciliationRequest.CommitReconciliation cr : request.commits()) {
            WeeklyCommit commit = commitMap.get(cr.commitId());
            if (commit == null) {
                throw new EntityNotFoundException("Commit not found in plan: " + cr.commitId());
            }

            commit.setCompletionStatus(cr.completionStatus());
            commit.setActualOutcome(cr.actualOutcome());
            commit.setBlockerNotes(cr.blockerNotes());
            commitRepository.save(commit);

            if (cr.carryForward()) {
                if (nextPlan == null) {
                    nextPlan = planRepository.findByUserIdAndWeekOf(plan.getUserId(), nextMonday)
                            .orElseGet(() -> {
                                WeeklyPlan np = new WeeklyPlan();
                                np.setUserId(plan.getUserId());
                                np.setWeekOf(nextMonday);
                                np.setStatus(PlanStatus.DRAFT);
                                return planRepository.save(np);
                            });
                }
                carryForwardCommit(commit, nextPlan);
            }
        }

        plan.setStatus(PlanStatus.RECONCILED);
        plan.setReconciledAt(OffsetDateTime.now());

        return toResponse(planRepository.save(plan));
    }

    private void carryForwardCommit(WeeklyCommit source, WeeklyPlan nextPlan) {
        WeeklyCommit carried = new WeeklyCommit();
        carried.setPlan(nextPlan);
        carried.setTitle(source.getTitle());
        carried.setDescription(source.getDescription());
        carried.setCarriedFromId(source.getId());
        // chess_category and priority_rank are null for carried commits

        carried = commitRepository.save(carried);

        // Copy RCDO links
        for (CommitRcdoLink srcLink : source.getRcdoLinks()) {
            CommitRcdoLink newLink = new CommitRcdoLink();
            newLink.setCommit(carried);
            newLink.setRallyCry(srcLink.getRallyCry());
            newLink.setDefiningObjective(srcLink.getDefiningObjective());
            newLink.setOutcome(srcLink.getOutcome());
            carried.getRcdoLinks().add(newLink);
        }

        commitRepository.save(carried);
    }

    private void createSnapshot(WeeklyCommit commit, SnapshotType snapshotType) {
        CommitSnapshot snapshot = new CommitSnapshot();
        snapshot.setCommit(commit);
        snapshot.setSnapshotType(snapshotType);
        snapshot.setTitle(commit.getTitle());
        snapshot.setDescription(commit.getDescription());
        snapshot.setChessCategory(commit.getChessCategory());
        snapshot.setPriorityRank(commit.getPriorityRank());

        // Serialize RCDO links as JSON
        List<Map<String, UUID>> linkData = commit.getRcdoLinks().stream()
                .map(link -> Map.of(
                        "rallyCryId", link.getRallyCry().getId(),
                        "definingObjectiveId", link.getDefiningObjective().getId(),
                        "outcomeId", link.getOutcome().getId()
                ))
                .toList();

        try {
            snapshot.setRcdoLinks(objectMapper.writeValueAsString(linkData));
        } catch (JsonProcessingException e) {
            snapshot.setRcdoLinks("[]");
        }

        snapshotRepository.save(snapshot);
    }

    private WeeklyPlan findPlanOrThrow(UUID planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Plan not found: " + planId));
    }

    private void validateMonday(LocalDate weekOf) {
        if (weekOf.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new IllegalArgumentException("weekOf must be a Monday, got: " + weekOf);
        }
    }

    private PlanResponse toResponse(WeeklyPlan plan) {
        List<WeeklyCommitResponse> commitResponses = plan.getCommits().stream()
                .filter(c -> c.getDeletedAt() == null)
                .map(commitService::toResponse)
                .toList();

        return new PlanResponse(
                plan.getId(),
                plan.getUserId(),
                plan.getWeekOf(),
                plan.getStatus(),
                plan.getLockedAt(),
                plan.getReconciliationStartedAt(),
                plan.getReconciledAt(),
                plan.getCreatedAt(),
                plan.getUpdatedAt(),
                commitResponses
        );
    }
}
