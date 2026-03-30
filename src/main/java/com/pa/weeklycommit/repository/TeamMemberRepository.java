package com.pa.weeklycommit.repository;

import com.pa.weeklycommit.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findByManagerId(UUID managerId);
}
