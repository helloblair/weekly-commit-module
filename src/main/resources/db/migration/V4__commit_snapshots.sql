-- =============================================
-- Commit Snapshots
-- =============================================

CREATE TABLE IF NOT EXISTS commit_snapshots (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id      UUID        NOT NULL,
    snapshot_type  VARCHAR(20) NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    chess_category VARCHAR(20),
    priority_rank  INTEGER,
    rcdo_links     JSONB       NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_commit_snapshots_commit FOREIGN KEY (commit_id)
        REFERENCES weekly_commits (id) ON DELETE CASCADE
);
