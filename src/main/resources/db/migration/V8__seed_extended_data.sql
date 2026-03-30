-- =============================================
-- Extended Dev Seed Data (V8)
-- Adds: more team members, previous-week history, a RECONCILING plan,
-- carry-forward chains, snapshots, multi-RCDO commits, and more commits per user.
-- =============================================

-- === Additional Team Members ===

INSERT INTO team_members (manager_id, member_id, display_name) VALUES
    ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000004', 'Priya Mehta'),
    ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000005', 'Marcus Johnson');


-- === Previous Week Plans (2026-03-16) — all RECONCILED ===

-- Alex Chen — previous week (RECONCILED)
INSERT INTO weekly_plans (id, user_id, week_of, status, locked_at, reconciliation_started_at, reconciled_at) VALUES
    ('d0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
     '2026-03-16', 'RECONCILED',
     '2026-03-17 09:00:00-05', '2026-03-20 16:00:00-05', '2026-03-21 10:00:00-05');

-- Jordan Rivera — previous week (RECONCILED)
INSERT INTO weekly_plans (id, user_id, week_of, status, locked_at, reconciliation_started_at, reconciled_at) VALUES
    ('d0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002',
     '2026-03-16', 'RECONCILED',
     '2026-03-17 08:30:00-05', '2026-03-20 15:00:00-05', '2026-03-20 17:00:00-05');

-- Sam Okafor — previous week (RECONCILED)
INSERT INTO weekly_plans (id, user_id, week_of, status, locked_at, reconciliation_started_at, reconciled_at) VALUES
    ('d0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003',
     '2026-03-16', 'RECONCILED',
     '2026-03-17 10:00:00-05', '2026-03-21 09:00:00-05', '2026-03-21 14:00:00-05');


-- === Current Week Plans for new members (2026-03-23) ===

-- Priya Mehta — RECONCILING (mid-lifecycle, great for testing that flow)
INSERT INTO weekly_plans (id, user_id, week_of, status, locked_at, reconciliation_started_at) VALUES
    ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
     '2026-03-23', 'RECONCILING',
     '2026-03-25 09:00:00-05', '2026-03-28 14:00:00-05');

-- Marcus Johnson — DRAFT (just started, few commits)
INSERT INTO weekly_plans (id, user_id, week_of, status) VALUES
    ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005',
     '2026-03-23', 'DRAFT');


-- === Previous Week Commits (Alex, week of 2026-03-16) ===

INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank, completion_status, actual_outcome) VALUES
    ('e0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000010',
     'Design RCDO data model', 'ERD for rally_cries, defining_objectives, outcomes with org scoping',
     'KING', 1, 'COMPLETED', 'ERD approved, migrations V1-V3 merged to main'),
    ('e0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000010',
     'Scaffold Spring Boot project', 'Maven project with Spring Web, JPA, Security, Flyway',
     'QUEEN', 1, 'COMPLETED', 'Project scaffolded, CI pipeline green'),
    ('e0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000010',
     'Set up Module Federation', 'Webpack config with remote entry, shared React deps',
     'ROOK', 1, 'COMPLETED', 'remoteEntry.js serving correctly from dev server'),
    ('e0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000010',
     'Write state machine unit tests', 'Cover all valid transitions and rejection paths',
     'KNIGHT', 1, 'PARTIAL', 'Happy paths done, edge cases deferred to this week'),
    ('e0000000-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000010',
     'Draft API contract doc', 'OpenAPI spec for all planned endpoints',
     'PAWN', 1, 'NOT_STARTED', NULL);

-- RCDO links for Alex's previous week
INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000008');


-- === Previous Week Commits (Jordan, week of 2026-03-16) ===

INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank, completion_status, actual_outcome) VALUES
    ('e0000000-0000-0000-0000-000000000030', 'd0000000-0000-0000-0000-000000000011',
     'Research SAML libraries', 'Evaluate spring-security-saml2 vs onelogin toolkit',
     'KING', 1, 'COMPLETED', 'Chose spring-security-saml2 — better Spring Boot 3 integration'),
    ('e0000000-0000-0000-0000-000000000031', 'd0000000-0000-0000-0000-000000000011',
     'Prototype Okta SAML flow', 'End-to-end login flow with Okta dev tenant',
     'QUEEN', 1, 'PARTIAL', 'Login works, logout redirect broken — carrying forward'),
    ('e0000000-0000-0000-0000-000000000032', 'd0000000-0000-0000-0000-000000000011',
     'Write enterprise pricing data model', 'Plans, features, entitlements tables',
     'ROOK', 1, 'COMPLETED', 'Schema merged, seed data for 3 tiers');

INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('e0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('e0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');


-- === Previous Week Commits (Sam, week of 2026-03-16) ===

INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank, completion_status, actual_outcome) VALUES
    ('e0000000-0000-0000-0000-000000000040', 'd0000000-0000-0000-0000-000000000012',
     'Collect historical churn data', 'Export 12 months of account churn events from Salesforce',
     'KING', 1, 'COMPLETED', 'CSV export complete, 2,400 churn events across 800 accounts'),
    ('e0000000-0000-0000-0000-000000000041', 'd0000000-0000-0000-0000-000000000012',
     'Feature engineering for health score', 'Define engagement signals: login freq, feature adoption, support tickets',
     'QUEEN', 1, 'COMPLETED', '14 features defined, correlation analysis shows 5 strong predictors'),
    ('e0000000-0000-0000-0000-000000000042', 'd0000000-0000-0000-0000-000000000012',
     'Set up Slack webhook for alerts', 'Create #csm-alerts channel and configure incoming webhook',
     'ROOK', 1, 'BLOCKED', NULL);

UPDATE weekly_commits SET blocker_notes = 'Slack admin approval pending — IT ticket #4521'
WHERE id = 'e0000000-0000-0000-0000-000000000042';

INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-00000000000b'),
    ('e0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-00000000000b'),
    ('e0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-00000000000c');


-- === Carry-forward: Alex's "Write state machine tests" → current week commit e0000000...02 ===

UPDATE weekly_commits SET carried_from_id = 'e0000000-0000-0000-0000-000000000023'
WHERE id = 'e0000000-0000-0000-0000-000000000002';


-- === Additional commits for Alex's current DRAFT (more to categorize) ===

INSERT INTO weekly_commits (id, plan_id, title, description) VALUES
    ('e0000000-0000-0000-0000-000000000050', 'd0000000-0000-0000-0000-000000000001',
     'Implement commit soft-delete endpoint', 'DELETE /api/v1/commits/{id} sets deleted_at timestamp'),
    ('e0000000-0000-0000-0000-000000000051', 'd0000000-0000-0000-0000-000000000001',
     'Add manager team-rollup aggregation', 'SQL query joining plans, commits, and team_members for roll-up view'),
    ('e0000000-0000-0000-0000-000000000052', 'd0000000-0000-0000-0000-000000000001',
     'Wire up reconciliation submission', 'POST endpoint + frontend form for recording actual outcomes');

-- Multi-RCDO links: commit 50 links to two different outcomes
INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007'),
    ('e0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005'),
    ('e0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000008'),
    ('e0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007');


-- === Priya Mehta — RECONCILING plan, 5 commits with chess categories ===

INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank) VALUES
    ('e0000000-0000-0000-0000-000000000060', 'd0000000-0000-0000-0000-000000000004',
     'Redesign onboarding step 1 (signup)', 'Simplify to email-only, defer profile to post-onboard',
     'KING', 1),
    ('e0000000-0000-0000-0000-000000000061', 'd0000000-0000-0000-0000-000000000004',
     'A/B test signup CTA copy', 'Test "Start free" vs "Get started" vs "Try it now"',
     'QUEEN', 1),
    ('e0000000-0000-0000-0000-000000000062', 'd0000000-0000-0000-0000-000000000004',
     'Implement in-app upgrade banner', 'Show contextual upsell when user hits free-tier limit',
     'ROOK', 1),
    ('e0000000-0000-0000-0000-000000000063', 'd0000000-0000-0000-0000-000000000004',
     'Track PLG funnel metrics', 'Add Mixpanel events for signup → activation → conversion',
     'KNIGHT', 1),
    ('e0000000-0000-0000-0000-000000000064', 'd0000000-0000-0000-0000-000000000004',
     'Update pricing FAQ page', 'Address top 10 sales objections from Gong call analysis',
     'PAWN', 1);

INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'),
    ('e0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'),
    ('e0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004'),
    ('e0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'),
    -- Multi-link: upgrade banner ties to both Self-Serve Pipeline AND Revenue Growth
    ('e0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000064', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004');


-- === Marcus Johnson — DRAFT plan, 2 commits (just getting started) ===

INSERT INTO weekly_commits (id, plan_id, title, description) VALUES
    ('e0000000-0000-0000-0000-000000000070', 'd0000000-0000-0000-0000-000000000005',
     'Audit existing support KB articles', 'Inventory all 200+ articles, flag stale content'),
    ('e0000000-0000-0000-0000-000000000071', 'd0000000-0000-0000-0000-000000000005',
     'Define ticket auto-categorization rules', 'Map subject line patterns to support categories');

INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-00000000000a'),
    ('e0000000-0000-0000-0000-000000000071', 'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000009');


-- === Additional commits for Jordan's current LOCKED plan ===

INSERT INTO weekly_commits (id, plan_id, title, description, chess_category, priority_rank) VALUES
    ('e0000000-0000-0000-0000-000000000080', 'd0000000-0000-0000-0000-000000000002',
     'Fix Okta logout redirect', 'Debug SAML LogoutResponse handling — carried from last week',
     'KING', 2),
    ('e0000000-0000-0000-0000-000000000081', 'd0000000-0000-0000-0000-000000000002',
     'Azure AD SAML integration', 'Configure metadata exchange and attribute mapping',
     'QUEEN', 2),
    ('e0000000-0000-0000-0000-000000000082', 'd0000000-0000-0000-0000-000000000002',
     'Enterprise checkout flow UI', 'Multi-step form: plan select → billing → confirmation',
     'ROOK', 1),
    ('e0000000-0000-0000-0000-000000000083', 'd0000000-0000-0000-0000-000000000002',
     'Write integration tests for SSO', 'Mock IdP responses, test error paths',
     'KNIGHT', 1);

-- Carry-forward: Jordan's Okta logout fix carried from previous week
UPDATE weekly_commits SET carried_from_id = 'e0000000-0000-0000-0000-000000000031'
WHERE id = 'e0000000-0000-0000-0000-000000000080';

INSERT INTO commit_rcdo_links (commit_id, rally_cry_id, defining_objective_id, outcome_id) VALUES
    ('e0000000-0000-0000-0000-000000000080', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('e0000000-0000-0000-0000-000000000081', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('e0000000-0000-0000-0000-000000000082', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000083', 'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');


-- === Snapshots for LOCKED and RECONCILED plans ===

-- Jordan's LOCKED plan snapshots (captured at lock time)
INSERT INTO commit_snapshots (commit_id, snapshot_type, title, description, chess_category, priority_rank, rcdo_links) VALUES
    ('e0000000-0000-0000-0000-000000000004', 'LOCKED', 'Implement SSO SAML flow',
     'SAML 2.0 integration with Okta and Azure AD', 'KING', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000002"}]'),
    ('e0000000-0000-0000-0000-000000000005', 'LOCKED', 'Enterprise pricing API endpoints',
     'REST endpoints for plan comparison and checkout', 'QUEEN', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000001"}]'),
    ('e0000000-0000-0000-0000-000000000006', 'LOCKED', 'Update API docs for enterprise tier',
     'Swagger annotations for new endpoints', 'PAWN', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000001"}]'),
    ('e0000000-0000-0000-0000-000000000080', 'LOCKED', 'Fix Okta logout redirect',
     'Debug SAML LogoutResponse handling — carried from last week', 'KING', 2,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000002"}]'),
    ('e0000000-0000-0000-0000-000000000081', 'LOCKED', 'Azure AD SAML integration',
     'Configure metadata exchange and attribute mapping', 'QUEEN', 2,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000002"}]'),
    ('e0000000-0000-0000-0000-000000000082', 'LOCKED', 'Enterprise checkout flow UI',
     'Multi-step form: plan select → billing → confirmation', 'ROOK', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000001"}]'),
    ('e0000000-0000-0000-0000-000000000083', 'LOCKED', 'Write integration tests for SSO',
     'Mock IdP responses, test error paths', 'KNIGHT', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000002"}]');

-- Sam's RECONCILED plan snapshots (both LOCKED and RECONCILED snapshots)
INSERT INTO commit_snapshots (commit_id, snapshot_type, title, description, chess_category, priority_rank, rcdo_links) VALUES
    ('e0000000-0000-0000-0000-000000000007', 'LOCKED', 'Deploy health score model to staging',
     'Train and validate model, deploy behind feature flag', 'KING', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000006","outcomeId":"c0000000-0000-0000-0000-00000000000b"}]'),
    ('e0000000-0000-0000-0000-000000000007', 'RECONCILED', 'Deploy health score model to staging',
     'Train and validate model, deploy behind feature flag', 'KING', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000006","outcomeId":"c0000000-0000-0000-0000-00000000000b"}]'),
    ('e0000000-0000-0000-0000-000000000008', 'LOCKED', 'Build CSM alert Slack integration',
     'Webhook-based alerts to #csm-alerts channel', 'QUEEN', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000006","outcomeId":"c0000000-0000-0000-0000-00000000000c"}]'),
    ('e0000000-0000-0000-0000-000000000008', 'RECONCILED', 'Build CSM alert Slack integration',
     'Webhook-based alerts to #csm-alerts channel', 'QUEEN', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000006","outcomeId":"c0000000-0000-0000-0000-00000000000c"}]'),
    ('e0000000-0000-0000-0000-000000000009', 'LOCKED', 'Ticket triage rules engine',
     'Rule-based auto-categorization for incoming support tickets', 'ROOK', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000005","outcomeId":"c0000000-0000-0000-0000-000000000009"}]'),
    ('e0000000-0000-0000-0000-000000000009', 'RECONCILED', 'Ticket triage rules engine',
     'Rule-based auto-categorization for incoming support tickets', 'ROOK', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000005","outcomeId":"c0000000-0000-0000-0000-000000000009"}]'),
    ('e0000000-0000-0000-0000-00000000000a', 'LOCKED', 'Update onboarding email sequence',
     'Revise 5-email drip campaign based on new segments', 'KNIGHT', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000003"}]'),
    ('e0000000-0000-0000-0000-00000000000a', 'RECONCILED', 'Update onboarding email sequence',
     'Revise 5-email drip campaign based on new segments', 'KNIGHT', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000003","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000003"}]');

-- Priya's RECONCILING plan snapshots (LOCKED snapshots captured before reconciliation started)
INSERT INTO commit_snapshots (commit_id, snapshot_type, title, description, chess_category, priority_rank, rcdo_links) VALUES
    ('e0000000-0000-0000-0000-000000000060', 'LOCKED', 'Redesign onboarding step 1 (signup)',
     'Simplify to email-only, defer profile to post-onboard', 'KING', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000003"}]'),
    ('e0000000-0000-0000-0000-000000000061', 'LOCKED', 'A/B test signup CTA copy',
     'Test "Start free" vs "Get started" vs "Try it now"', 'QUEEN', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000003"}]'),
    ('e0000000-0000-0000-0000-000000000062', 'LOCKED', 'Implement in-app upgrade banner',
     'Show contextual upsell when user hits free-tier limit', 'ROOK', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000004"},{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000001","outcomeId":"c0000000-0000-0000-0000-000000000001"}]'),
    ('e0000000-0000-0000-0000-000000000063', 'LOCKED', 'Track PLG funnel metrics',
     'Add Mixpanel events for signup → activation → conversion', 'KNIGHT', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000003"}]'),
    ('e0000000-0000-0000-0000-000000000064', 'LOCKED', 'Update pricing FAQ page',
     'Address top 10 sales objections from Gong call analysis', 'PAWN', 1,
     '[{"rallyCryId":"a0000000-0000-0000-0000-000000000001","definingObjectiveId":"b0000000-0000-0000-0000-000000000002","outcomeId":"c0000000-0000-0000-0000-000000000004"}]');
