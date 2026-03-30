package com.pa.weeklycommit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"manager_id", "member_id"})
})
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "manager_id", nullable = false)
    private UUID managerId;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @CreationTimestamp
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getManagerId() { return managerId; }
    public UUID getMemberId() { return memberId; }
    public String getDisplayName() { return displayName; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
