-- =============================================
-- RCDO Hierarchy: Rally Cries → Defining Objectives → Outcomes
-- =============================================

CREATE TABLE IF NOT EXISTS rally_cries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID        NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS defining_objectives (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    rally_cry_id  UUID        NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_defining_objectives_rally_cry FOREIGN KEY (rally_cry_id)
        REFERENCES rally_cries (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS outcomes (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    defining_objective_id  UUID        NOT NULL,
    title                  VARCHAR(255) NOT NULL,
    description            TEXT,
    measurable_target      VARCHAR(255),
    active                 BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_outcomes_defining_objective FOREIGN KEY (defining_objective_id)
        REFERENCES defining_objectives (id) ON DELETE CASCADE
);
