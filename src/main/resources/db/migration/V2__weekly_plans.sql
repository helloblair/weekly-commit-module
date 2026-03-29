-- =============================================
-- Weekly Plans
-- =============================================

CREATE TABLE IF NOT EXISTS weekly_plans (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID        NOT NULL,
    week_of                   DATE        NOT NULL,
    status                    VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    locked_at                 TIMESTAMPTZ,
    reconciliation_started_at TIMESTAMPTZ,
    reconciled_at             TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_weekly_plans_status
        CHECK (status IN ('DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED')),

    CONSTRAINT uq_weekly_plans_user_week UNIQUE (user_id, week_of)
);
