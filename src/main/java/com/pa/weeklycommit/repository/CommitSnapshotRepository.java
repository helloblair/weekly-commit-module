package com.pa.weeklycommit.repository;

import com.pa.weeklycommit.entity.CommitSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommitSnapshotRepository extends JpaRepository<CommitSnapshot, UUID> {

    List<CommitSnapshot> findByCommitId(UUID commitId);
}
