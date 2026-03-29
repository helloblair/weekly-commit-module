package com.pa.weeklycommit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "commit_rcdo_links")
public class CommitRcdoLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commit_id", nullable = false)
    private WeeklyCommit commit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rally_cry_id", nullable = false)
    private RallyCry rallyCry;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "defining_objective_id", nullable = false)
    private DefiningObjective definingObjective;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "outcome_id", nullable = false)
    private Outcome outcome;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public CommitRcdoLink() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public WeeklyCommit getCommit() {
        return commit;
    }

    public void setCommit(WeeklyCommit commit) {
        this.commit = commit;
    }

    public RallyCry getRallyCry() {
        return rallyCry;
    }

    public void setRallyCry(RallyCry rallyCry) {
        this.rallyCry = rallyCry;
    }

    public DefiningObjective getDefiningObjective() {
        return definingObjective;
    }

    public void setDefiningObjective(DefiningObjective definingObjective) {
        this.definingObjective = definingObjective;
    }

    public Outcome getOutcome() {
        return outcome;
    }

    public void setOutcome(Outcome outcome) {
        this.outcome = outcome;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CommitRcdoLink that = (CommitRcdoLink) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
