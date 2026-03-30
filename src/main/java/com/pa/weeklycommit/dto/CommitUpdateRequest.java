package com.pa.weeklycommit.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CommitUpdateRequest(
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        String description,

        String chessCategory,

        Integer priorityRank,

        List<@Valid RcdoLinkRequest> rcdoLinks
) {}
