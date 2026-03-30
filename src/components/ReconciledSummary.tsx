import React from 'react';
import type { WeeklyCommit, CompletionStatus } from '../types/domain';
import { CompletionStatus as CS } from '../types/domain';
import { useTheme, completionTheme, chessTheme } from '../theme';

interface ReconciledSummaryProps {
  commits: WeeklyCommit[];
}

function completionStats(commits: WeeklyCommit[]) {
  const counts: Record<string, number> = {
    COMPLETED: 0,
    PARTIAL: 0,
    NOT_STARTED: 0,
    BLOCKED: 0,
  };
  for (const c of commits) {
    if (c.completionStatus) counts[c.completionStatus]++;
  }
  return counts;
}

export default function ReconciledSummary({ commits }: ReconciledSummaryProps) {
  const { mode } = useTheme();
  const stats = completionStats(commits);
  const total = commits.length;

  return (
    <div style={rsStyles.container}>
      <h2 style={rsStyles.heading}>Week Reconciled</h2>

      <div style={rsStyles.statsRow}>
        {([CS.COMPLETED, CS.PARTIAL, CS.NOT_STARTED, CS.BLOCKED] as CompletionStatus[]).map(
          (status) => {
            const meta = completionTheme(status, mode);
            const count = stats[status];
            return (
              <div
                key={status}
                style={{
                  ...rsStyles.statCard,
                  backgroundColor: meta.bg,
                  borderColor: meta.color,
                }}
              >
                <div style={{ ...rsStyles.statCount, color: meta.color }}>{count}</div>
                <div style={{ ...rsStyles.statLabel, color: meta.color }}>{meta.label}</div>
              </div>
            );
          },
        )}
      </div>

      <div style={rsStyles.list}>
        {commits.map((commit) => {
          const statusMeta = commit.completionStatus
            ? completionTheme(commit.completionStatus, mode)
            : null;
          const chessMeta = commit.chessCategory
            ? chessTheme(commit.chessCategory, mode)
            : null;

          return (
            <div key={commit.id} style={rsStyles.card}>
              <div style={rsStyles.cardHeader}>
                <div style={rsStyles.cardLeft}>
                  <h3 style={rsStyles.cardTitle}>{commit.title}</h3>
                  <div style={rsStyles.metaRow}>
                    {chessMeta && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: chessMeta.color,
                        backgroundColor: chessMeta.bg,
                      }}>
                        {chessMeta.label}
                      </span>
                    )}
                    {statusMeta && (
                      <span
                        style={{
                          ...rsStyles.statusBadge,
                          color: statusMeta.color,
                          backgroundColor: statusMeta.bg,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    )}
                    {commit.carriedFromId && (
                      <span style={rsStyles.carriedBadge}>Carried forward</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={rsStyles.comparisonGrid}>
                <div style={rsStyles.comparisonCol}>
                  <div style={rsStyles.comparisonLabel}>Planned</div>
                  <div style={rsStyles.comparisonText}>
                    {commit.description ?? commit.title}
                  </div>
                </div>
                <div style={rsStyles.comparisonCol}>
                  <div style={rsStyles.comparisonLabel}>Actual</div>
                  <div style={rsStyles.comparisonText}>
                    {commit.actualOutcome ?? '—'}
                  </div>
                </div>
              </div>

              {commit.blockerNotes && (
                <div style={rsStyles.blockerSection}>
                  <div style={rsStyles.blockerLabel}>Blocker Notes</div>
                  <div style={rsStyles.blockerText}>{commit.blockerNotes}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={rsStyles.footer}>
        {total > 0 && (
          <span style={rsStyles.footerText}>
            {stats.COMPLETED} of {total} commitments completed (
            {total > 0 ? Math.round((stats.COMPLETED / total) * 100) : 0}%)
          </span>
        )}
      </div>
    </div>
  );
}

const rsStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  heading: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600 as const,
    color: 'var(--text)',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  statCard: {
    flex: '1 1 0',
    minWidth: '100px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    textAlign: 'center' as const,
    transition: 'background-color 200ms ease, border-color 200ms ease',
  },
  statCount: {
    fontSize: '24px',
    fontWeight: 700 as const,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: 500 as const,
    marginTop: '2px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  card: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    boxShadow: 'var(--shadow)',
    transition: 'background-color 200ms ease, border-color 200ms ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600 as const,
    color: 'var(--text)',
  },
  metaRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap' as const,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500 as const,
  },
  carriedBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500 as const,
    color: 'var(--primary)',
    backgroundColor: 'var(--primary-bg)',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  comparisonCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  comparisonLabel: {
    fontSize: '11px',
    fontWeight: 600 as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  comparisonText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  blockerSection: {
    backgroundColor: 'var(--warning-bg)',
    borderRadius: '6px',
    padding: '8px 12px',
    transition: 'background-color 200ms ease',
  },
  blockerLabel: {
    fontSize: '11px',
    fontWeight: 600 as const,
    color: 'var(--warning)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  blockerText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  footer: {
    paddingTop: '8px',
    borderTop: '1px solid var(--border)',
  },
  footerText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: 500 as const,
  },
};
