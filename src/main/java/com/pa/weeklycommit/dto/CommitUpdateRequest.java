package com.pa.weeklycommit.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CommitUpdateRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        String description,

        @NotEmpty(message = "At least one RCDO link is required")
        List<@Valid RcdoLinkRequest> rcdoLinks
) {}
