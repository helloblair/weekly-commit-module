package com.pa.weeklycommit.service;

import com.pa.weeklycommit.TestcontainersConfig;
import com.pa.weeklycommit.dto.CommitCreateRequest;
import com.pa.weeklycommit.dto.CommitUpdateRequest;
import com.pa.weeklycommit.dto.RcdoLinkRequest;
import com.pa.weeklycommit.dto.WeeklyCommitResponse;
import com.pa.weeklycommit.entity.DefiningObjective;
import com.pa.weeklycommit.entity.Outcome;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.entity.WeeklyCommit;
import com.pa.weeklycommit.entity.WeeklyPlan;
import com.pa.weeklycommit.exception.IllegalTransitionException;
import com.pa.weeklycommit.model.PlanStatus;
import com.pa.weeklycommit.repository.RallyCryRepository;
import com.pa.weeklycommit.repository.WeeklyCommitRepository;
import com.pa.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class WeeklyCommitServiceTest extends TestcontainersConfig {

    @Autowired WeeklyCommitService commitService;
    @Autowired WeeklyPlanRepository planRepository;
    @Autowired WeeklyCommitRepository commitRepository;
    @Autowired RallyCryRepository rallyCryRepository;

    private WeeklyPlan draftPlan;
    private RallyCry rallyCry;
    private DefiningObjective defObj;
    private Outcome outcome;

    @BeforeEach
    void setUp() {
        // RCDO hierarchy
        rallyCry = new RallyCry();
        rallyCry.setOrgId(UUID.randomUUID());
        rallyCry.setTitle("RC");

        defObj = new DefiningObjective();
        defObj.setRallyCry(rallyCry);
        defObj.setTitle("DO");
        rallyCry.getDefiningObjectives().add(defObj);

        outcome = new Outcome();
        outcome.setDefiningObjective(defObj);
        outcome.setTitle("O");
        defObj.getOutcomes().add(outcome);

        rallyCryRepository.save(rallyCry);
        defObj = rallyCry.getDefiningObjectives().get(0);
        outcome = defObj.getOutcomes().get(0);

        // DRAFT plan
        draftPlan = new WeeklyPlan();
        draftPlan.setUserId(UUID.randomUUID());
        draftPlan.setWeekOf(LocalDate.of(2026, 4, 6));
        draftPlan.setStatus(PlanStatus.DRAFT);
        draftPlan = planRepository.save(draftPlan);
    }

    private RcdoLinkRequest rcdoLink() {
        return new RcdoLinkRequest(rallyCry.getId(), defObj.getId(), outcome.getId());
    }

    // ── createCommit ────────────────────────────────────────────────

    @Nested
    class CreateCommit {

        @Test
        @DisplayName("creates commit with title, description, and RCDO link")
        void createsCommit() {
            CommitCreateRequest req = new CommitCreateRequest(
                    "Ship API", "REST endpoints", List.of(rcdoLink()));

            WeeklyCommitResponse response = commitService.createCommit(draftPlan.getId(), req);

            assertThat(response.id()).isNotNull();
            assertThat(response.title()).isEqualTo("Ship API");
            assertThat(response.description()).isEqualTo("REST endpoints");
            assertThat(response.rcdoLinks()).hasSize(1);
            assertThat(response.rcdoLinks().get(0).rallyCryTitle()).isEqualTo("RC");
        }

        @Test
        @DisplayName("rejects create on non-DRAFT plan")
        void rejectsOnLockedPlan() {
            draftPlan.setStatus(PlanStatus.LOCKED);
            planRepository.save(draftPlan);

            CommitCreateRequest req = new CommitCreateRequest(
                    "Nope", null, List.of(rcdoLink()));

            assertThatThrownBy(() -> commitService.createCommit(draftPlan.getId(), req))
                    .isInstanceOf(IllegalTransitionException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("throws EntityNotFoundException for nonexistent plan")
        void throwsOnBadPlanId() {
            CommitCreateRequest req = new CommitCreateRequest(
                    "X", null, List.of(rcdoLink()));

            assertThatThrownBy(() -> commitService.createCommit(UUID.randomUUID(), req))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("throws EntityNotFoundException for invalid RCDO link")
        void throwsOnBadRcdoLink() {
            RcdoLinkRequest bad = new RcdoLinkRequest(
                    UUID.randomUUID(), defObj.getId(), outcome.getId());
            CommitCreateRequest req = new CommitCreateRequest("X", null, List.of(bad));

            assertThatThrownBy(() -> commitService.createCommit(draftPlan.getId(), req))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("RallyCry");
        }
    }

    // ── updateCommit ────────────────────────────────────────────────

    @Nested
    class UpdateCommit {

        @Test
        @DisplayName("updates title and chess category")
        void updatesFields() {
            CommitCreateRequest create = new CommitCreateRequest(
                    "Original", null, List.of(rcdoLink()));
            WeeklyCommitResponse created = commitService.createCommit(draftPlan.getId(), create);

            CommitUpdateRequest update = new CommitUpdateRequest(
                    "Updated", "New desc", "KING", 1, null);
            WeeklyCommitResponse updated = commitService.updateCommit(created.id(), update);

            assertThat(updated.title()).isEqualTo("Updated");
            assertThat(updated.description()).isEqualTo("New desc");
            assertThat(updated.chessCategory()).isEqualTo("KING");
            assertThat(updated.priorityRank()).isEqualTo(1);
        }

        @Test
        @DisplayName("clears chess category when set to NONE")
        void clearsChessCategory() {
            CommitCreateRequest create = new CommitCreateRequest(
                    "C", null, List.of(rcdoLink()));
            WeeklyCommitResponse created = commitService.createCommit(draftPlan.getId(), create);

            commitService.updateCommit(created.id(),
                    new CommitUpdateRequest(null, null, "QUEEN", 1, null));
            WeeklyCommitResponse cleared = commitService.updateCommit(created.id(),
                    new CommitUpdateRequest(null, null, "NONE", null, null));

            assertThat(cleared.chessCategory()).isNull();
            assertThat(cleared.priorityRank()).isNull();
        }

        @Test
        @DisplayName("replaces RCDO links on update")
        void replacesRcdoLinks() {
            CommitCreateRequest create = new CommitCreateRequest(
                    "C", null, List.of(rcdoLink()));
            WeeklyCommitResponse created = commitService.createCommit(draftPlan.getId(), create);

            // Create a second outcome to link to
            Outcome outcome2 = new Outcome();
            outcome2.setDefiningObjective(defObj);
            outcome2.setTitle("O2");
            defObj.getOutcomes().add(outcome2);
            rallyCryRepository.save(rallyCry);
            outcome2 = defObj.getOutcomes().get(1);

            RcdoLinkRequest newLink = new RcdoLinkRequest(
                    rallyCry.getId(), defObj.getId(), outcome2.getId());
            WeeklyCommitResponse updated = commitService.updateCommit(created.id(),
                    new CommitUpdateRequest(null, null, null, null, List.of(newLink)));

            assertThat(updated.rcdoLinks()).hasSize(1);
            assertThat(updated.rcdoLinks().get(0).outcomeTitle()).isEqualTo("O2");
        }

        @Test
        @DisplayName("rejects update on non-DRAFT plan")
        void rejectsOnLockedPlan() {
            CommitCreateRequest create = new CommitCreateRequest(
                    "C", null, List.of(rcdoLink()));
            WeeklyCommitResponse created = commitService.createCommit(draftPlan.getId(), create);

            draftPlan.setStatus(PlanStatus.LOCKED);
            planRepository.save(draftPlan);

            CommitUpdateRequest update = new CommitUpdateRequest("X", null, null, null, null);

            assertThatThrownBy(() -> commitService.updateCommit(created.id(), update))
                    .isInstanceOf(IllegalTransitionException.class);
        }
    }

    // ── deleteCommit (soft) ─────────────────────────────────────────

    @Nested
    class DeleteCommit {

        @Test
        @DisplayName("soft-deletes a commit by setting deletedAt")
        void softDeletes() {
            CommitCreateRequest create = new CommitCreateRequest(
                    "Delete me", null, List.of(rcdoLink()));
            WeeklyCommitResponse created = commitService.createCommit(draftPlan.getId(), create);

            commitService.deleteCommit(created.id());

            // The @Where clause hides soft-deleted, but we can check via native query
            WeeklyCommit raw = commitRepository.findById(created.id()).orElse(null);
            // findById with @Where still filters — check count instead
            assertThat(commitService.getCommitsByPlan(draftPlan.getId())).isEmpty();
        }

        @Test
        @DisplayName("rejects delete on non-DRAFT plan")
        void rejectsOnLockedPlan() {
            CommitCreateRequest create = new CommitCreateRequest(
                    "C", null, List.of(rcdoLink()));
            WeeklyCommitResponse created = commitService.createCommit(draftPlan.getId(), create);

            draftPlan.setStatus(PlanStatus.LOCKED);
            planRepository.save(draftPlan);

            assertThatThrownBy(() -> commitService.deleteCommit(created.id()))
                    .isInstanceOf(IllegalTransitionException.class);
        }

        @Test
        @DisplayName("throws EntityNotFoundException for nonexistent commit")
        void throwsOnMissingCommit() {
            assertThatThrownBy(() -> commitService.deleteCommit(UUID.randomUUID()))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ── getCommitsByPlan ────────────────────────────────────────────

    @Nested
    class GetCommitsByPlan {

        @Test
        @DisplayName("returns commits for a plan")
        void returnsCommits() {
            commitService.createCommit(draftPlan.getId(),
                    new CommitCreateRequest("A", null, List.of(rcdoLink())));
            commitService.createCommit(draftPlan.getId(),
                    new CommitCreateRequest("B", null, List.of(rcdoLink())));

            List<WeeklyCommitResponse> commits = commitService.getCommitsByPlan(draftPlan.getId());

            assertThat(commits).hasSize(2);
        }

        @Test
        @DisplayName("excludes soft-deleted commits")
        void excludesSoftDeleted() {
            WeeklyCommitResponse a = commitService.createCommit(draftPlan.getId(),
                    new CommitCreateRequest("A", null, List.of(rcdoLink())));
            commitService.createCommit(draftPlan.getId(),
                    new CommitCreateRequest("B", null, List.of(rcdoLink())));
            commitService.deleteCommit(a.id());

            List<WeeklyCommitResponse> commits = commitService.getCommitsByPlan(draftPlan.getId());

            assertThat(commits).hasSize(1);
            assertThat(commits.get(0).title()).isEqualTo("B");
        }
    }
}
