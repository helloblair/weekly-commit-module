import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { WeeklyPlan, WeeklyCommit, RCDOHierarchy, PlanStatus } from '../types/domain';
import { PlanStatus as PlanStatusEnum } from '../types/domain';
import { fetchWeeklyPlan, fetchCommits, deleteCommit, fetchRCDOHierarchy, transitionPlan } from '../api/client';
import CommitCard from '../components/CommitCard';
import CommitForm from '../components/CommitForm';
import ChessBoard from '../components/ChessBoard';
import ReconciliationView from '../components/ReconciliationView';
import ReconciledSummary from '../components/ReconciledSummary';

interface WeeklyCommitPageProps {
  userId: string;
  orgId: string;
}

// ---- date helpers ----

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekLabel(monday: Date): string {
  const sunday = addWeeks(monday, 0);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = monday.toLocaleDateString('en-US', opts);
  const endOpts: Intl.DateTimeFormatOptions =
    monday.getMonth() === sunday.getMonth()
      ? { day: 'numeric' }
      : { month: 'short', day: 'numeric' };
  const end = sunday.toLocaleDateString('en-US', endOpts);
  return `${start} – ${end}, ${monday.getFullYear()}`;
}

const LIFECYCLE_STEPS: { key: PlanStatus; label: string; description: string }[] = [
  { key: PlanStatusEnum.DRAFT, label: 'Draft', description: 'Add and edit your commits' },
  { key: PlanStatusEnum.LOCKED, label: 'Locked', description: 'Commits finalized for the week' },
  { key: PlanStatusEnum.RECONCILING, label: 'Reconciling', description: 'Record outcomes for each commit' },
  { key: PlanStatusEnum.RECONCILED, label: 'Reconciled', description: 'Week is complete' },
];

const TRANSITION_ACTIONS: Partial<Record<PlanStatus, { label: string; action: 'lock' | 'start-reconciliation' | 'complete-reconciliation' }>> = {
  [PlanStatusEnum.DRAFT]: { label: 'Lock Week', action: 'lock' },
  [PlanStatusEnum.LOCKED]: { label: 'Start Reconciliation', action: 'start-reconciliation' },
};

function LifecycleStepper({ status }: { status: PlanStatus }) {
  const currentIdx = LIFECYCLE_STEPS.findIndex((s) => s.key === status);

  return (
    <div style={stepperStyles.container}>
      {LIFECYCLE_STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div
                style={{
                  ...stepperStyles.connector,
                  backgroundColor: isPast || isCurrent ? '#1976d2' : '#e0e0e0',
                }}
              />
            )}
            <div style={stepperStyles.step}>
              <div
                style={{
                  ...stepperStyles.dot,
                  backgroundColor: isPast ? '#1976d2' : isCurrent ? '#1976d2' : '#e0e0e0',
                  border: isCurrent ? '3px solid #90caf9' : '3px solid transparent',
                }}
              >
                {isPast ? '✓' : i + 1}
              </div>
              <div style={stepperStyles.labelGroup}>
                <div
                  style={{
                    ...stepperStyles.label,
                    color: isCurrent ? '#1976d2' : isPast ? '#333' : '#999',
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {step.label}
                </div>
                {isCurrent && (
                  <div style={stepperStyles.description}>{step.description}</div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const stepperStyles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0px',
    padding: '16px 0',
    marginBottom: '8px',
  },
  step: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    minWidth: '90px',
    flex: '0 0 auto',
  },
  dot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600 as const,
    color: '#fff',
    flexShrink: 0,
  },
  connector: {
    height: '3px',
    flex: '1 1 0',
    alignSelf: 'center' as const,
    marginTop: '-10px',
    borderRadius: '2px',
    minWidth: '24px',
  },
  labelGroup: {
    textAlign: 'center' as const,
  },
  label: {
    fontSize: '13px',
  },
  description: {
    fontSize: '11px',
    color: '#666',
    marginTop: '2px',
  },
};

// ---- styles ----

const styles = {
  page: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navButton: {
    padding: '6px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer' as const,
    fontSize: '16px',
    lineHeight: 1,
    color: '#333',
  },
  weekLabel: {
    fontSize: '16px',
    fontWeight: 600 as const,
    color: '#1a1a1a',
    minWidth: '200px',
    textAlign: 'center' as const,
  },
  newButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
    whiteSpace: 'nowrap' as const,
  },
  newButtonDisabled: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#90caf9',
    color: '#fff',
    cursor: 'not-allowed' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
    whiteSpace: 'nowrap' as const,
  },
  transitionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  transitionButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
  },
  transitionButtonDisabled: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#90caf9',
    color: '#fff',
    cursor: 'not-allowed' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
  },
  commitList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  empty: {
    textAlign: 'center' as const,
    color: '#888',
    fontSize: '15px',
    padding: '48px 16px',
  },
  loading: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '14px',
    padding: '48px 16px',
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    color: '#611a15',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
};

export default function WeeklyCommitPage({ userId, orgId }: WeeklyCommitPageProps) {
  const [weekMonday, setWeekMonday] = useState(() => getMondayOfWeek(new Date()));
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [commits, setCommits] = useState<WeeklyCommit[]>([]);
  const [hierarchy, setHierarchy] = useState<RCDOHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommit, setEditingCommit] = useState<WeeklyCommit | undefined>(undefined);
  const [transitioning, setTransitioning] = useState(false);

  const weekNavRef = useRef<HTMLDivElement>(null);

  // ---- data fetching ----

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const weekOf = toISODate(weekMonday);
      const [fetchedPlan, fetchedHierarchy] = await Promise.all([
        fetchWeeklyPlan(userId, weekOf),
        hierarchy ? Promise.resolve(hierarchy) : fetchRCDOHierarchy(orgId),
      ]);
      setPlan(fetchedPlan);
      if (!hierarchy) setHierarchy(fetchedHierarchy);

      const fetchedCommits = await fetchCommits(fetchedPlan.id);
      setCommits(fetchedCommits);
    } catch {
      setError('Failed to load weekly plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [weekMonday, userId, orgId, hierarchy]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  // ---- keyboard nav for week selector ----

  useEffect(() => {
    const el = weekNavRef.current;
    if (!el) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWeekMonday((prev) => addWeeks(prev, -1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWeekMonday((prev) => addWeeks(prev, 1));
      }
    };

    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, []);

  // ---- handlers ----

  const handleSave = useCallback((saved: WeeklyCommit) => {
    setCommits((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    setFormOpen(false);
    setEditingCommit(undefined);
  }, []);

  const handleEdit = useCallback((commit: WeeklyCommit) => {
    setEditingCommit(commit);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (commitId: string) => {
    setCommits((prev) => {
      const removed = prev.find((c) => c.id === commitId);
      if (!removed) return prev;

      const next = prev.filter((c) => c.id !== commitId);

      // fire-and-forget delete; restore on failure
      deleteCommit(commitId).catch(() => {
        setCommits((current) => {
          if (current.some((c) => c.id === commitId)) return current;
          return [...current, removed];
        });
        setError('Failed to delete commit. It has been restored.');
      });

      return next;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setFormOpen(false);
    setEditingCommit(undefined);
  }, []);

  const openNewForm = useCallback(() => {
    setEditingCommit(undefined);
    setFormOpen(true);
  }, []);

  const handleCommitsReordered = useCallback((updated: WeeklyCommit[]) => {
    setCommits(updated);
  }, []);

  const handleReconciliationComplete = useCallback(() => {
    loadWeek();
  }, [loadWeek]);

  const handleTransition = useCallback(async () => {
    if (!plan) return;
    const config = TRANSITION_ACTIONS[plan.status];
    if (!config) return;

    setTransitioning(true);
    setError(null);
    try {
      const updatedPlan = await transitionPlan(plan.id, config.action);
      setPlan(updatedPlan);
      // Re-fetch commits since backend may have modified them (snapshots, carry-forward)
      const freshCommits = await fetchCommits(updatedPlan.id);
      setCommits(freshCommits);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Transition failed. Please try again.';
      setError(message);
    } finally {
      setTransitioning(false);
    }
  }, [plan]);

  // ---- render ----

  const isDraft = plan?.status === PlanStatusEnum.DRAFT;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div
          ref={weekNavRef}
          style={styles.weekNav}
          tabIndex={0}
          role="group"
          aria-label="Week navigation"
        >
          <button
            type="button"
            style={styles.navButton}
            onClick={() => setWeekMonday((prev) => addWeeks(prev, -1))}
            aria-label="Previous week"
          >
            &lsaquo;
          </button>
          <span style={styles.weekLabel}>{formatWeekLabel(weekMonday)}</span>
          <button
            type="button"
            style={styles.navButton}
            onClick={() => setWeekMonday((prev) => addWeeks(prev, 1))}
            aria-label="Next week"
          >
            &rsaquo;
          </button>
        </div>

        <button
          type="button"
          style={isDraft || !plan ? styles.newButton : styles.newButtonDisabled}
          disabled={!!plan && !isDraft}
          onClick={openNewForm}
        >
          + New Commit
        </button>
      </div>

      {plan && (
        <>
          <LifecycleStepper status={plan.status} />
          {TRANSITION_ACTIONS[plan.status] && (
            <div style={styles.transitionRow}>
              <button
                type="button"
                style={transitioning ? styles.transitionButtonDisabled : styles.transitionButton}
                disabled={transitioning}
                onClick={handleTransition}
              >
                {transitioning ? 'Processing...' : TRANSITION_ACTIONS[plan.status]!.label}
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button
            type="button"
            style={{
              marginLeft: '12px',
              padding: '2px 8px',
              border: '1px solid #611a15',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#611a15',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={() => { setError(null); loadWeek(); }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading commits...</div>
      ) : commits.length === 0 ? (
        <div style={styles.empty}>
          No commits this week. Add your first commit to get started.
        </div>
      ) : isDraft && plan ? (
        <>
          <ChessBoard
            planId={plan.id}
            commits={commits}
            planStatus={plan.status}
            onCommitsReordered={handleCommitsReordered}
          />
          <div style={{ ...styles.commitList, marginTop: '24px' }}>
            {commits.map((commit) => (
              <CommitCard
                key={commit.id}
                commit={commit}
                planStatus={plan.status}
                hierarchy={hierarchy ?? undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      ) : plan?.status === PlanStatusEnum.RECONCILING ? (
        <ReconciliationView
          planId={plan.id}
          commits={commits}
          onComplete={handleReconciliationComplete}
        />
      ) : plan?.status === PlanStatusEnum.RECONCILED ? (
        <ReconciledSummary commits={commits} />
      ) : (
        <div style={styles.commitList}>
          {commits.map((commit) => (
            <CommitCard
              key={commit.id}
              commit={commit}
              planStatus={plan?.status ?? PlanStatusEnum.DRAFT}
              hierarchy={hierarchy ?? undefined}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {formOpen && plan && (
        <CommitForm
          planId={plan.id}
          orgId={orgId}
          existingCommit={editingCommit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
