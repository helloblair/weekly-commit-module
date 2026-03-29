-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week
    ON weekly_plans (user_id, week_of);

CREATE INDEX IF NOT EXISTS idx_weekly_commits_plan
    ON weekly_commits (plan_id);

CREATE INDEX IF NOT EXISTS idx_weekly_commits_carried_from
    ON weekly_commits (carried_from_id)
    WHERE carried_from_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commit_rcdo_links_commit
    ON commit_rcdo_links (commit_id);

CREATE INDEX IF NOT EXISTS idx_commit_rcdo_links_outcome
    ON commit_rcdo_links (outcome_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commit_priority
    ON weekly_commits (plan_id, chess_category, priority_rank)
    WHERE deleted_at IS NULL;
