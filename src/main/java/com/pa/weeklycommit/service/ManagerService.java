package com.pa.weeklycommit.service;

import com.pa.weeklycommit.dto.RcdoCoverageResponse;
import com.pa.weeklycommit.dto.TeamRollupResponse;
import com.pa.weeklycommit.entity.CommitRcdoLink;
import com.pa.weeklycommit.entity.DefiningObjective;
import com.pa.weeklycommit.entity.Outcome;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.entity.TeamMember;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.model.CompletionStatus;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.repository.RallyCryRepository;
import com.pa.weeklycommit.repository.TeamMemberRepository;
import com.pa.weeklycommit.repository.WeeklyPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ManagerService {

    private final TeamMemberRepository teamMemberRepository;
    private final WeeklyPlanRepository weeklyPlanRepository;
    private final RallyCryRepository rallyCryRepository;

    public ManagerService(TeamMemberRepository teamMemberRepository,
                          WeeklyPlanRepository weeklyPlanRepository,
                          RallyCryRepository rallyCryRepository) {
        this.teamMemberRepository = teamMemberRepository;
        this.weeklyPlanRepository = weeklyPlanRepository;
        this.rallyCryRepository = rallyCryRepository;
    }

    public TeamRollupResponse getTeamRollup(UUID managerId, LocalDate weekOf) {
        List<TeamMember> members = teamMemberRepository.findByManagerId(managerId);
        List<UUID> memberIds = members.stream().map(TeamMember::getMemberId).toList();
        Map<UUID, String> nameMap = new HashMap<>();
        for (TeamMember m : members) {
            nameMap.put(m.getMemberId(), m.getDisplayName());
        }

        List<WeeklyPlan> plans = memberIds.isEmpty()
                ? List.of()
                : weeklyPlanRepository.findByUserIdInAndWeekOf(memberIds, weekOf);
        Map<UUID, WeeklyPlan> planMap = new HashMap<>();
        for (WeeklyPlan p : plans) {
            planMap.put(p.getUserId(), p);
        }

        List<TeamRollupResponse.TeamMemberSummary> summaries = new ArrayList<>();
        for (TeamMember member : members) {
            WeeklyPlan plan = planMap.get(member.getMemberId());
            PlanStatus status = plan != null ? plan.getStatus() : PlanStatus.DRAFT;
            List<WeeklyCommit> commits = plan != null
                    ? plan.getCommits().stream()
                          .filter(c -> c.getDeletedAt() == null)
                          .toList()
                    : List.of();

            List<TeamRollupResponse.CommitSummary> commitSummaries = commits.stream()
                    .map(c -> new TeamRollupResponse.CommitSummary(
                            c.getId(),
                            c.getTitle(),
                            c.getChessCategory(),
                            c.getCompletionStatus(),
                            buildRcdoPath(c)
                    ))
                    .toList();

            TeamRollupResponse.CompletionStats stats = buildStats(commits);

            summaries.add(new TeamRollupResponse.TeamMemberSummary(
                    member.getMemberId(),
                    member.getDisplayName(),
                    status,
                    commitSummaries,
                    stats
            ));
        }

        return new TeamRollupResponse(weekOf, summaries);
    }

    public RcdoCoverageResponse getRcdoCoverage(UUID managerId, UUID orgId, LocalDate weekOf) {
        List<TeamMember> members = teamMemberRepository.findByManagerId(managerId);
        List<UUID> memberIds = members.stream().map(TeamMember::getMemberId).toList();
        Map<UUID, String> nameMap = new HashMap<>();
        for (TeamMember m : members) {
            nameMap.put(m.getMemberId(), m.getDisplayName());
        }

        // Gather all commits for the team this week
        List<WeeklyPlan> plans = memberIds.isEmpty()
                ? List.of()
                : weeklyPlanRepository.findByUserIdInAndWeekOf(memberIds, weekOf);

        // Map outcome ID -> list of (commit, userId) pairs
        Map<UUID, List<OutcomeCommitRef>> outcomeCommits = new HashMap<>();
        for (WeeklyPlan plan : plans) {
            for (WeeklyCommit commit : plan.getCommits()) {
                if (commit.getDeletedAt() != null) continue;
                for (CommitRcdoLink link : commit.getRcdoLinks()) {
                    outcomeCommits
                            .computeIfAbsent(link.getOutcome().getId(), k -> new ArrayList<>())
                            .add(new OutcomeCommitRef(commit, plan.getUserId()));
                }
            }
        }

        // Build RCDO tree with coverage info
        List<RallyCry> rallyCries = rallyCryRepository.findByOrgIdAndActiveTrue(orgId);
        List<RcdoCoverageResponse.RallyCryCoverage> rcNodes = new ArrayList<>();

        for (RallyCry rc : rallyCries) {
            List<RcdoCoverageResponse.DefiningObjectiveCoverage> doNodes = new ArrayList<>();
            boolean rcCovered = false;

            for (DefiningObjective dobj : rc.getDefiningObjectives()) {
                if (!dobj.isActive()) continue;
                List<RcdoCoverageResponse.OutcomeCoverage> outcomeNodes = new ArrayList<>();
                boolean doCovered = false;

                for (Outcome outcome : dobj.getOutcomes()) {
                    if (!outcome.isActive()) continue;
                    List<OutcomeCommitRef> refs = outcomeCommits.getOrDefault(outcome.getId(), List.of());
                    boolean oCovered = !refs.isEmpty();

                    List<RcdoCoverageResponse.CommitRef> commitRefs = refs.stream()
                            .map(r -> new RcdoCoverageResponse.CommitRef(
                                    r.commit.getId(),
                                    r.userId,
                                    nameMap.getOrDefault(r.userId, r.userId.toString()),
                                    r.commit.getTitle(),
                                    r.commit.getCompletionStatus()
                            ))
                            .toList();

                    long completed = refs.stream()
                            .filter(r -> r.commit.getCompletionStatus() == CompletionStatus.COMPLETED)
                            .count();
                    double completionRate = refs.isEmpty() ? 0.0 : (double) completed / refs.size();

                    outcomeNodes.add(new RcdoCoverageResponse.OutcomeCoverage(
                            outcome.getId(), outcome.getTitle(), oCovered, completionRate, commitRefs
                    ));
                    if (oCovered) doCovered = true;
                }

                doNodes.add(new RcdoCoverageResponse.DefiningObjectiveCoverage(
                        dobj.getId(), dobj.getTitle(), doCovered, outcomeNodes
                ));
                if (doCovered) rcCovered = true;
            }

            rcNodes.add(new RcdoCoverageResponse.RallyCryCoverage(
                    rc.getId(), rc.getTitle(), rcCovered, doNodes
            ));
        }

        return new RcdoCoverageResponse(weekOf, rcNodes);
    }

    private String buildRcdoPath(WeeklyCommit commit) {
        if (commit.getRcdoLinks() == null || commit.getRcdoLinks().isEmpty()) {
            return "";
        }
        CommitRcdoLink first = commit.getRcdoLinks().get(0);
        return "%s > %s > %s".formatted(
                first.getRallyCry().getTitle(),
                first.getDefiningObjective().getTitle(),
                first.getOutcome().getTitle()
        );
    }

    private TeamRollupResponse.CompletionStats buildStats(List<WeeklyCommit> commits) {
        int total = commits.size();
        int completed = 0, partial = 0, notStarted = 0, blocked = 0;
        for (WeeklyCommit c : commits) {
            if (c.getCompletionStatus() == null) continue;
            switch (c.getCompletionStatus()) {
                case COMPLETED -> completed++;
                case PARTIAL -> partial++;
                case NOT_STARTED -> notStarted++;
                case BLOCKED -> blocked++;
            }
        }
        return new TeamRollupResponse.CompletionStats(total, completed, partial, notStarted, blocked);
    }

    private record OutcomeCommitRef(WeeklyCommit commit, UUID userId) {}
}
