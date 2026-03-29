package com.pa.weeklycommit.repository;

import com.pa.weeklycommit.entity.WeeklyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, UUID> {

    Optional<WeeklyPlan> findByUserIdAndWeekOf(UUID userId, LocalDate weekOf);

    List<WeeklyPlan> findByUserIdInAndWeekOf(List<UUID> userIds, LocalDate weekOf);
}
