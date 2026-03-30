CREATE TABLE IF NOT EXISTS team_members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id    UUID         NOT NULL,
    member_id     UUID         NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),

    UNIQUE (manager_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_manager
    ON team_members (manager_id);
