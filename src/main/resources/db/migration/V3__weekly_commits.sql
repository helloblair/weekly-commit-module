-- =============================================
-- Weekly Commits & RCDO Links
-- =============================================

CREATE TABLE IF NOT EXISTS weekly_commits (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id           UUID        NOT NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    chess_category    VARCHAR(20),
    priority_rank     INTEGER,
    actual_outcome    TEXT,
    completion_status VARCHAR(20),
    blocker_notes     TEXT,
    carried_from_id   UUID,
    deleted_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_weekly_commits_plan FOREIGN KEY (plan_id)
        REFERENCES weekly_plans (id) ON DELETE CASCADE,

    CONSTRAINT fk_weekly_commits_carried_from FOREIGN KEY (carried_from_id)
        REFERENCES weekly_commits (id),

    CONSTRAINT chk_weekly_commits_chess_category
        CHECK (chess_category IN ('KING', 'QUEEN', 'ROOK', 'KNIGHT', 'PAWN')),

    CONSTRAINT chk_weekly_commits_completion_status
        CHECK (completion_status IN ('COMPLETED', 'PARTIAL', 'NOT_STARTED', 'BLOCKED'))
);

CREATE TABLE IF NOT EXISTS commit_rcdo_links (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id             UUID        NOT NULL,
    rally_cry_id          UUID        NOT NULL,
    defining_objective_id UUID        NOT NULL,
    outcome_id            UUID        NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_commit_rcdo_links_commit FOREIGN KEY (commit_id)
        REFERENCES weekly_commits (id) ON DELETE CASCADE,

    CONSTRAINT fk_commit_rcdo_links_rally_cry FOREIGN KEY (rally_cry_id)
        REFERENCES rally_cries (id),

    CONSTRAINT fk_commit_rcdo_links_defining_objective FOREIGN KEY (defining_objective_id)
        REFERENCES defining_objectives (id),

    CONSTRAINT fk_commit_rcdo_links_outcome FOREIGN KEY (outcome_id)
        REFERENCES outcomes (id)
);
