package com.pa.weeklycommit.entity;

import com.pa.weeklycommit.model.PlanStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "weekly_plans", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "week_of"})
})
public class WeeklyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "week_of", nullable = false)
    private LocalDate weekOf;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PlanStatus status = PlanStatus.DRAFT;

    @Column(name = "locked_at")
    private OffsetDateTime lockedAt;

    @Column(name = "reconciliation_started_at")
    private OffsetDateTime reconciliationStartedAt;

    @Column(name = "reconciled_at")
    private OffsetDateTime reconciledAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WeeklyCommit> commits = new ArrayList<>();

    public WeeklyPlan() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public LocalDate getWeekOf() {
        return weekOf;
    }

    public void setWeekOf(LocalDate weekOf) {
        this.weekOf = weekOf;
    }

    public PlanStatus getStatus() {
        return status;
    }

    public void setStatus(PlanStatus status) {
        this.status = status;
    }

    public OffsetDateTime getLockedAt() {
        return lockedAt;
    }

    public void setLockedAt(OffsetDateTime lockedAt) {
        this.lockedAt = lockedAt;
    }

    public OffsetDateTime getReconciliationStartedAt() {
        return reconciliationStartedAt;
    }

    public void setReconciliationStartedAt(OffsetDateTime reconciliationStartedAt) {
        this.reconciliationStartedAt = reconciliationStartedAt;
    }

    public OffsetDateTime getReconciledAt() {
        return reconciledAt;
    }

    public void setReconciledAt(OffsetDateTime reconciledAt) {
        this.reconciledAt = reconciledAt;
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

    public List<WeeklyCommit> getCommits() {
        return commits;
    }

    public void setCommits(List<WeeklyCommit> commits) {
        this.commits = commits;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WeeklyPlan that = (WeeklyPlan) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
