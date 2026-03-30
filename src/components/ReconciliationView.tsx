import React, { useState, useCallback } from 'react';
import type {
  WeeklyCommit,
  ReconciliationData,
  CompletionStatus,
  ChessCategory,
} from '../types/domain';
import { CompletionStatus as CS } from '../types/domain';
import { submitReconciliation } from '../api/client';

interface ReconciliationViewProps {
  planId: string;
  commits: WeeklyCommit[];
  onComplete: () => void;
}

const COMPLETION_OPTIONS: { value: CompletionStatus; label: string }[] = [
  { value: CS.COMPLETED, label: 'Completed' },
  { value: CS.PARTIAL, label: 'Partial' },
  { value: CS.NOT_STARTED, label: 'Not Started' },
  { value: CS.BLOCKED, label: 'Blocked' },
];

const CHESS_LABELS: Record<ChessCategory, string> = {
  KING: 'King',
  QUEEN: 'Queen',
  ROOK: 'Rook',
  KNIGHT: 'Knight',
  PAWN: 'Pawn',
};

interface CommitReconciliation {
  completionStatus: CompletionStatus | '';
  actualOutcome: string;
  blockerNotes: string;
  carryForward: boolean;
}

function buildInitialState(commits: WeeklyCommit[]): Record<string, CommitReconciliation> {
  const state: Record<string, CommitReconciliation> = {};
  for (const commit of commits) {
    state[commit.id] = {
      completionStatus: commit.completionStatus ?? '',
      actualOutcome: commit.actualOutcome ?? '',
      blockerNotes: commit.blockerNotes ?? '',
      carryForward: false,
    };
  }
  return state;
}

export default function ReconciliationView({
  planId,
  commits,
  onComplete,
}: ReconciliationViewProps) {
  const [entries, setEntries] = useState(() => buildInitialState(commits));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const updateEntry = useCallback(
    (commitId: string, field: keyof CommitReconciliation, value: string | boolean) => {
      setEntries((prev) => ({
        ...prev,
        [commitId]: { ...prev[commitId], [field]: value },
      }));
    },
    [],
  );

  const allValid = commits.every((c) => {
    const entry = entries[c.id];
    return entry.completionStatus !== '' && entry.actualOutcome.trim() !== '';
  });

  const handleSubmit = useCallback(async () => {
    setTouched(true);
    if (!allValid) return;

    const submissions: ReconciliationData[] = commits.map((c) => {
      const entry = entries[c.id];
      return {
        commitId: c.id,
        completionStatus: entry.completionStatus as CompletionStatus,
        actualOutcome: entry.actualOutcome.trim(),
        blockerNotes: entry.blockerNotes.trim() || null,
        carryForward: entry.carryForward,
      };
    });

    setSubmitting(true);
    setError(null);
    try {
      await submitReconciliation(planId, submissions);
      onComplete();
    } catch {
      setError('Failed to submit reconciliation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [allValid, commits, entries, planId, onComplete]);

  return (
    <div style={rvStyles.container}>
      <h2 style={rvStyles.heading}>Weekly Reconciliation</h2>
      <p style={rvStyles.subtitle}>
        Review each commitment and record what actually happened this week.
      </p>

      {error && <div style={rvStyles.error}>{error}</div>}

      <div style={rvStyles.list}>
        {commits.map((commit) => {
          const entry = entries[commit.id];
          const statusMissing = touched && entry.completionStatus === '';
          const outcomeMissing = touched && entry.actualOutcome.trim() === '';
          const showBlockerField =
            entry.completionStatus === CS.BLOCKED;
          const showCarryForward =
            entry.completionStatus === CS.PARTIAL ||
            entry.completionStatus === CS.NOT_STARTED ||
            entry.completionStatus === CS.BLOCKED;

          return (
            <div key={commit.id} style={rvStyles.card}>
              <div style={rvStyles.cardHeader}>
                <h3 style={rvStyles.cardTitle}>{commit.title}</h3>
                {commit.chessCategory && (
                  <span style={rvStyles.chessBadge}>
                    {CHESS_LABELS[commit.chessCategory]}
                  </span>
                )}
              </div>
              {commit.description && (
                <p style={rvStyles.plannedDescription}>{commit.description}</p>
              )}

              <div style={rvStyles.fieldGroup}>
                <label style={rvStyles.label}>
                  Completion Status<span style={rvStyles.required}>*</span>
                </label>
                <div style={rvStyles.statusRow}>
                  {COMPLETION_OPTIONS.map((opt) => {
                    const isSelected = entry.completionStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        style={{
                          ...rvStyles.statusChip,
                          backgroundColor: isSelected ? statusColor(opt.value) : '#f5f5f5',
                          color: isSelected ? '#fff' : '#555',
                          borderColor: isSelected ? statusColor(opt.value) : '#ddd',
                        }}
                        onClick={() => updateEntry(commit.id, 'completionStatus', opt.value)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {statusMissing && (
                  <div style={rvStyles.fieldError}>Select a completion status</div>
                )}
              </div>

              <div style={rvStyles.fieldGroup}>
                <label style={rvStyles.label}>
                  What actually happened?<span style={rvStyles.required}>*</span>
                </label>
                <textarea
                  style={rvStyles.textarea}
                  value={entry.actualOutcome}
                  onChange={(e) => updateEntry(commit.id, 'actualOutcome', e.target.value)}
                  placeholder="Describe the actual outcome..."
                  maxLength={2000}
                />
                {outcomeMissing && (
                  <div style={rvStyles.fieldError}>Actual outcome is required</div>
                )}
              </div>

              {showBlockerField && (
                <div style={rvStyles.fieldGroup}>
                  <label style={rvStyles.label}>Blocker Details</label>
                  <textarea
                    style={rvStyles.textarea}
                    value={entry.blockerNotes}
                    onChange={(e) => updateEntry(commit.id, 'blockerNotes', e.target.value)}
                    placeholder="What was the blocker?"
                    maxLength={2000}
                  />
                </div>
              )}

              {showCarryForward && (
                <label style={rvStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={entry.carryForward}
                    onChange={(e) => updateEntry(commit.id, 'carryForward', e.target.checked)}
                  />
                  <span style={rvStyles.checkboxLabel}>
                    Carry forward to next week
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div style={rvStyles.footer}>
        <button
          type="button"
          style={submitting || !allValid ? rvStyles.submitDisabled : rvStyles.submit}
          disabled={submitting || (touched && !allValid)}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit Reconciliation'}
        </button>
        {touched && !allValid && (
          <span style={rvStyles.footerHint}>
            Fill in all required fields to submit
          </span>
        )}
      </div>
    </div>
  );
}

function statusColor(status: CompletionStatus): string {
  switch (status) {
    case CS.COMPLETED:
      return '#2e7d32';
    case CS.PARTIAL:
      return '#ed6c02';
    case CS.NOT_STARTED:
      return '#757575';
    case CS.BLOCKED:
      return '#d32f2f';
  }
}

const rvStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  heading: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600 as const,
    color: '#1a1a1a',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  error: {
    backgroundColor: '#fdecea',
    color: '#611a15',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600 as const,
    color: '#1a1a1a',
    flex: 1,
    minWidth: 0,
  },
  chessBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500 as const,
    color: '#555',
    backgroundColor: '#f0f0f0',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  plannedDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.4,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500 as const,
    color: '#333',
  },
  required: {
    color: '#d32f2f',
    marginLeft: '2px',
  },
  statusRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  statusChip: {
    padding: '6px 14px',
    borderRadius: '16px',
    border: '1px solid #ddd',
    cursor: 'pointer' as const,
    fontSize: '13px',
    fontWeight: 500 as const,
    transition: 'all 150ms',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    minHeight: '60px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  fieldError: {
    color: '#d32f2f',
    fontSize: '12px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer' as const,
    padding: '4px 0',
  },
  checkboxLabel: {
    fontSize: '13px',
    color: '#333',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '8px',
  },
  submit: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
  },
  submitDisabled: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#90caf9',
    color: '#fff',
    cursor: 'not-allowed' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
  },
  footerHint: {
    fontSize: '12px',
    color: '#999',
  },
};
