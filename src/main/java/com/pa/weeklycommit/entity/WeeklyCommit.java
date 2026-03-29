package com.pa.weeklycommit.entity;

import com.pa.weeklycommit.model.ChessCategory;
import com.pa.weeklycommit.model.CompletionStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "weekly_commits")
@Where(clause = "deleted_at IS NULL")
public class WeeklyCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private WeeklyPlan plan;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "chess_category", length = 20)
    private ChessCategory chessCategory;

    @Column(name = "priority_rank")
    private Integer priorityRank;

    @Enumerated(EnumType.STRING)
    @Column(name = "completion_status", length = 20)
    private CompletionStatus completionStatus;

    @Column(name = "actual_outcome")
    private String actualOutcome;

    @Column(name = "blocker_notes")
    private String blockerNotes;

    @Column(name = "carried_from_id")
    private UUID carriedFromId;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "commit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommitRcdoLink> rcdoLinks = new ArrayList<>();

    public WeeklyCommit() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public WeeklyPlan getPlan() {
        return plan;
    }

    public void setPlan(WeeklyPlan plan) {
        this.plan = plan;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ChessCategory getChessCategory() {
        return chessCategory;
    }

    public void setChessCategory(ChessCategory chessCategory) {
        this.chessCategory = chessCategory;
    }

    public Integer getPriorityRank() {
        return priorityRank;
    }

    public void setPriorityRank(Integer priorityRank) {
        this.priorityRank = priorityRank;
    }

    public CompletionStatus getCompletionStatus() {
        return completionStatus;
    }

    public void setCompletionStatus(CompletionStatus completionStatus) {
        this.completionStatus = completionStatus;
    }

    public String getActualOutcome() {
        return actualOutcome;
    }

    public void setActualOutcome(String actualOutcome) {
        this.actualOutcome = actualOutcome;
    }

    public String getBlockerNotes() {
        return blockerNotes;
    }

    public void setBlockerNotes(String blockerNotes) {
        this.blockerNotes = blockerNotes;
    }

    public UUID getCarriedFromId() {
        return carriedFromId;
    }

    public void setCarriedFromId(UUID carriedFromId) {
        this.carriedFromId = carriedFromId;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(OffsetDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<CommitRcdoLink> getRcdoLinks() {
        return rcdoLinks;
    }

    public void setRcdoLinks(List<CommitRcdoLink> rcdoLinks) {
        this.rcdoLinks = rcdoLinks;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WeeklyCommit that = (WeeklyCommit) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
