package com.pa.weeklycommit.controller;

import com.pa.weeklycommit.dto.CommitCreateRequest;
import com.pa.weeklycommit.dto.CommitUpdateRequest;
import com.pa.weeklycommit.dto.WeeklyCommitResponse;
import com.pa.weeklycommit.service.WeeklyCommitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class WeeklyCommitController {

    private final WeeklyCommitService commitService;

    public WeeklyCommitController(WeeklyCommitService commitService) {
        this.commitService = commitService;
    }

    @GetMapping("/plans/{planId}/commits")
    public List<WeeklyCommitResponse> getCommits(@PathVariable UUID planId) {
        return commitService.getCommitsByPlan(planId);
    }

    @PostMapping("/plans/{planId}/commits")
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyCommitResponse createCommit(@PathVariable UUID planId,
                                             @Valid @RequestBody CommitCreateRequest request) {
        return commitService.createCommit(planId, request);
    }

    @PutMapping("/commits/{commitId}")
    public WeeklyCommitResponse updateCommit(@PathVariable UUID commitId,
                                             @Valid @RequestBody CommitUpdateRequest request) {
        return commitService.updateCommit(commitId, request);
    }

    @DeleteMapping("/commits/{commitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCommit(@PathVariable UUID commitId) {
        commitService.deleteCommit(commitId);
    }
}
