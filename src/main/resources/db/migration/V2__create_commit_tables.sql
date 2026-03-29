-- =============================================
-- Weekly Plans & Commits
-- =============================================

CREATE TABLE weekly_plans (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID        NOT NULL,
    week_of                   DATE        NOT NULL,
    status                    VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    locked_at                 TIMESTAMPTZ,
    reconciliation_started_at TIMESTAMPTZ,
    reconciled_at             TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_weekly_plans_user FOREIGN KEY (user_id)
        REFERENCES users (id),

    CONSTRAINT chk_weekly_plans_status
        CHECK (status IN ('DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED')),

    CONSTRAINT uq_weekly_plans_user_week UNIQUE (user_id, week_of)
);

CREATE INDEX idx_weekly_plans_user_id ON weekly_plans (user_id);

-- -------------------------------------------------

CREATE TABLE weekly_commits (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id           UUID        NOT NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    chess_category    VARCHAR(20),
    priority_rank     INTEGER,
    completion_status VARCHAR(20),
    actual_outcome    TEXT,
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

CREATE INDEX idx_weekly_commits_plan_id         ON weekly_commits (plan_id);
CREATE INDEX idx_weekly_commits_carried_from_id ON weekly_commits (carried_from_id);

-- plan_id uniquely identifies (user_id, week_of) via the unique constraint on weekly_plans
CREATE UNIQUE INDEX idx_weekly_commits_plan_category_rank
    ON weekly_commits (plan_id, chess_category, priority_rank)
    WHERE deleted_at IS NULL;

-- -------------------------------------------------

CREATE TABLE commit_rcdo_links (
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

CREATE INDEX idx_commit_rcdo_links_commit_id             ON commit_rcdo_links (commit_id);
CREATE INDEX idx_commit_rcdo_links_rally_cry_id          ON commit_rcdo_links (rally_cry_id);
CREATE INDEX idx_commit_rcdo_links_defining_objective_id ON commit_rcdo_links (defining_objective_id);
CREATE INDEX idx_commit_rcdo_links_outcome_id            ON commit_rcdo_links (outcome_id);

-- -------------------------------------------------

CREATE TABLE commit_snapshots (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id      UUID        NOT NULL,
    snapshot_type  VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    chess_category VARCHAR(20),
    priority_rank  INTEGER,
    rcdo_links     JSONB       NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_commit_snapshots_commit FOREIGN KEY (commit_id)
        REFERENCES weekly_commits (id) ON DELETE CASCADE
);

CREATE INDEX idx_commit_snapshots_commit_id ON commit_snapshots (commit_id);
