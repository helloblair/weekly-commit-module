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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "commit_snapshots")
@Getter
@Setter
@NoArgsConstructor
public class CommitSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commit_id", nullable = false)
    private WeeklyCommit commit;

    @Column(name = "snapshot_type", nullable = false, length = 20)
    private String snapshotType = "LOCKED";

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "chess_category", length = 20)
    private String chessCategory;

    @Column(name = "priority_rank")
    private Integer priorityRank;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rcdo_links", nullable = false, columnDefinition = "jsonb")
    private String rcdoLinks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
