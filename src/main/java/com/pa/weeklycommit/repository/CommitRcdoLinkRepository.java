package com.pa.weeklycommit.repository;

import com.pa.weeklycommit.entity.CommitRcdoLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommitRcdoLinkRepository extends JpaRepository<CommitRcdoLink, UUID> {

    List<CommitRcdoLink> findByCommitId(UUID commitId);

    @Modifying
    @Query("DELETE FROM CommitRcdoLink c WHERE c.commit.id = :commitId")
    void deleteByCommitId(@Param("commitId") UUID commitId);
}
