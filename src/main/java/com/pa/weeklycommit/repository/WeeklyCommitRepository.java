package com.pa.weeklycommit.repository;

import com.pa.weeklycommit.entity.WeeklyCommit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface WeeklyCommitRepository extends JpaRepository<WeeklyCommit, UUID> {

    @Query("SELECT c FROM WeeklyCommit c JOIN c.plan p " +
           "WHERE p.userId = :userId AND p.weekOf = :weekOf AND c.deletedAt IS NULL")
    List<WeeklyCommit> findByUserIdAndWeekOfAndDeletedAtIsNull(
            @Param("userId") UUID userId,
            @Param("weekOf") LocalDate weekOf);

    List<WeeklyCommit> findByPlanId(UUID planId);

    List<WeeklyCommit> findByPlanIdOrderByPriorityRankAsc(UUID planId);

    long countByPlanId(UUID planId);
}
