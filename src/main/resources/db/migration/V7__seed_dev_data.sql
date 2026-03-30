-- =============================================
-- Dev Seed Data
-- Populates all tables with realistic data for local testing.
-- Uses the stub IDs from bootstrap.tsx:
--   User:    00000000-0000-0000-0000-000000000001
--   Org:     00000000-0000-0000-0000-000000000010
--   Manager: 00000000-0000-0000-0000-000000000099
-- =============================================

-- === RCDO Hierarchy ===

-- Rally Cry 1: Revenue Growth
INSERT INTO rally_cries (id, org_id, title, description) VALUES
    ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010',
     'Accelerate Revenue Growth', 'Drive 40% YoY revenue growth through product-led expansion'),
    ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010',
     'Operational Excellence', 'Reduce friction in internal workflows and improve delivery velocity'),
    ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010',
     'Customer Retention', 'Achieve 95% net retention through proactive engagement');

-- Defining Objectives under Revenue Growth
INSERT INTO defining_objectives (id, rally_cry_id, title, description) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'Launch Enterprise Tier', 'Ship enterprise pricing and feature gating by Q2'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'Expand Self-Serve Pipeline', 'Increase PLG conversion rate to 8%');

-- Defining Objectives under Operational Excellence
INSERT INTO defining_objectives (id, rally_cry_id, title, description) VALUES
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
     'Automate CI/CD Pipeline', 'Reduce deployment cycle time from 4 days to < 1 day'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
     'Standardize Weekly Planning', 'Replace 15-Five with RCDO-linked weekly commits');

-- Defining Objectives under Customer Retention
INSERT INTO defining_objectives (id, rally_cry_id, title, description) VALUES
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003',
     'Reduce Time-to-Resolution', 'Cut average support ticket resolution from 48h to 24h'),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003',
     'Proactive Health Scoring', 'Implement customer health score dashboard for CSMs');

-- Outcomes under each Defining Objective
INSERT INTO outcomes (id, defining_objective_id, title, description, measurable_target) VALUES
    -- Enterprise Tier
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
     'Enterprise pricing page live', 'Public pricing page with feature comparison', 'Page live by Apr 15'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
     'SSO integration complete', 'SAML/OIDC support for enterprise customers', '3 pilot customers onboarded'),
    -- Self-Serve Pipeline
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'Onboarding flow redesign', 'Reduce onboarding drop-off by 30%', 'Drop-off < 25%'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
     'In-app upgrade prompts', 'Context-aware upsell nudges', 'CTR > 5%'),
    -- CI/CD
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
     'Automated staging deploys', 'Every PR merge auto-deploys to staging', '< 15 min deploy time'),
    ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
     'Rollback automation', 'One-click rollback for production releases', 'Rollback < 5 min'),
    -- Weekly Planning
    ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004',
     'Weekly Commit MVP shipped', 'Core commit CRUD with RCDO linking', '100% team adoption'),
    ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004',
     'Manager dashboard live', 'Team roll-up and RCDO coverage views', 'All managers onboarded'),
    -- Time-to-Resolution
    ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005',
     'Ticket triage automation', 'Auto-categorize and route incoming tickets', 'Avg resolution < 24h'),
    ('c0000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-000000000005',
     'Knowledge base refresh', 'Update top 50 support articles', '30% fewer repeat tickets'),
    -- Health Scoring
    ('c0000000-0000-0000-0000-00000000000b', 'b0000000-0000-0000-0000-000000000006',
     'Health score model v1', 'Usage + engagement composite score', 'Score correlates with churn r>0.7'),
    ('c0000000-0000-0000-0000-00000000000c', 'b0000000-0000-0000-0000-000000000006',
     'CSM alert system', 'Automated alerts when health drops below threshold', 'Alerts within 24h of drop');


-- === Team Members (under the stub manager) ===

INSERT INTO team_members (manager_id, member_id, display_name) VALUES
    ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000001', 'Alex Chen'),
    ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000002', 'Jordan Rivera'),
    ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000003', 'Sam Okafor');


-- === Weekly Plans (week of 2026-03-23) ===

-- Alex Chen: DRAFT plan with commits (the stub user — full lifecycle testing)
INSERT INTO weekly_plans (id, user_id, week_of, status) VALUES
    ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     '2026-03-23', 'DRAFT');

-- Jordan Rivera: LOCKED plan
INSERT INTO weekly_plans (id, user_id, week_of, status, locked_at) VALUES
    ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
     '2026-03-23', 'LOCKED', '2026-03-27 10:00:00-05');

-- Sam Okafor: RECONCILED plan (completed full lifecycle)
INSERT INTO weekly_plans (id, user_id, week_of, status, locked_at, reconciliation_started_at, reconciled_at) VALUES
    ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
     '2026-03-23', 'RECONCILED',
     '2026-03-24 09:00:00-05', '2026-03-28 14:00:00-05', '2026-03-29 16:00:00-05');


-- === Weekly Commits ===

-- Alex Chen's commits (DRAFT — no chess category or reconciliation yet)
INSERT INTO weekly_commits (id, plan_id, title, description) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
     'Build RCDO cascading selector component',
     'Three-level dropdown that filters Objectives by Rally Cry and Outcomes by Objective'),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
     'Write Flyway migrations for commit snapshots',
     'V4 migration with JSONB column for RCDO link snapshots'),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001',
     'Fix CORS config for dev proxy',
     'Webpack dev server proxy to avoid cross-origin issues in local dev');

-- Jordan Rivera's commits (LOCKED — has chess categories and priorities)
INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank) VALUES
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002',
     'Implement SSO SAML flow', 'SAML 2.0 integration with Okta and Azure AD',
     'KING', 1),
    ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002',
     'Enterprise pricing API endpoints', 'REST endpoints for plan comparison and checkout',
     'QUEEN', 1),
    ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002',
     'Update API docs for enterprise tier', 'Swagger annotations for new endpoints',
     'PAWN', 1);

-- Sam Okafor's commits (RECONCILED — full data including completion)
INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank, completion_status, actual_outcome) VALUES
    ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003',
     'Deploy health score model to staging', 'Train and validate model, deploy behind feature flag',
     'KING', 1, 'COMPLETED', 'Model deployed, r=0.73 against historical churn data'),
    ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003',
     'Build CSM alert Slack integration', 'Webhook-based alerts to #csm-alerts channel',
     'QUEEN', 1, 'PARTIAL', 'Webhook works, but rate limiting not implemented yet'),
    ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003',
     'Ticket triage rules engine', 'Rule-based auto-categorization for incoming support tickets',
     'ROOK', 1, 'BLOCKED', NULL),
    ('e0000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-000000000003',
     'Update onboarding email sequence', 'Revise 5-email drip campaign based on new segments',
     'KNIGHT', 1, 'NOT_STARTED', NULL);

-- Sam's blocked commit gets blocker notes
UPDATE weekly_commits SET blocker_notes = 'Waiting on data engineering to expose ticket metadata API'
WHERE id = 'e0000000-0000-0000-0000-000000000009';


-- === RCDO Links ===

-- Alex Chen's commits → Weekly Planning outcomes
INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005');

-- Jordan Rivera's commits → Enterprise Tier outcomes
INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');

-- Sam Okafor's commits → Customer Retention outcomes
INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-00000000000b'),
    ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-00000000000c'),
    ('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000009'),
    ('e0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003');
