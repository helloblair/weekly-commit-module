package com.pa.weeklycommit.repository;

import com.pa.weeklycommit.entity.DefiningObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DefiningObjectiveRepository extends JpaRepository<DefiningObjective, UUID> {
}
