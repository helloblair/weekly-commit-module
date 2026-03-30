import React from 'react';
import type { WeeklyCommit, CompletionStatus, ChessCategory } from '../types/domain';
import { CompletionStatus as CS } from '../types/domain';

interface ReconciledSummaryProps {
  commits: WeeklyCommit[];
}

const STATUS_META: Record<CompletionStatus, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: 'Completed', color: '#1b5e20', bg: '#e8f5e9' },
  PARTIAL: { label: 'Partial', color: '#e65100', bg: '#fff3e0' },
  NOT_STARTED: { label: 'Not Started', color: '#424242', bg: '#f5f5f5' },
  BLOCKED: { label: 'Blocked', color: '#b71c1c', bg: '#ffebee' },
};

const CHESS_LABELS: Record<ChessCategory, string> = {
  KING: 'King',
  QUEEN: 'Queen',
  ROOK: 'Rook',
  KNIGHT: 'Knight',
  PAWN: 'Pawn',
};

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
  const stats = completionStats(commits);
  const total = commits.length;

  return (
    <div style={rsStyles.container}>
      <h2 style={rsStyles.heading}>Week Reconciled</h2>

      <div style={rsStyles.statsRow}>
        {([CS.COMPLETED, CS.PARTIAL, CS.NOT_STARTED, CS.BLOCKED] as CompletionStatus[]).map(
          (status) => {
            const meta = STATUS_META[status];
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
            ? STATUS_META[commit.completionStatus]
            : null;

          return (
            <div key={commit.id} style={rsStyles.card}>
              <div style={rsStyles.cardHeader}>
                <div style={rsStyles.cardLeft}>
                  <h3 style={rsStyles.cardTitle}>{commit.title}</h3>
                  <div style={rsStyles.metaRow}>
                    {commit.chessCategory && (
                      <span style={rsStyles.chessBadge}>
                        {CHESS_LABELS[commit.chessCategory]}
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
    color: '#1a1a1a',
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
    color: '#1a1a1a',
  },
  metaRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap' as const,
  },
  chessBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500 as const,
    color: '#555',
    backgroundColor: '#f0f0f0',
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
    color: '#1565c0',
    backgroundColor: '#e3f2fd',
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
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  comparisonText: {
    fontSize: '13px',
    color: '#333',
    lineHeight: 1.4,
  },
  blockerSection: {
    backgroundColor: '#fff8e1',
    borderRadius: '4px',
    padding: '8px 12px',
  },
  blockerLabel: {
    fontSize: '11px',
    fontWeight: 600 as const,
    color: '#f57f17',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  blockerText: {
    fontSize: '13px',
    color: '#333',
    lineHeight: 1.4,
  },
  footer: {
    paddingTop: '8px',
    borderTop: '1px solid #eee',
  },
  footerText: {
    fontSize: '14px',
    color: '#555',
    fontWeight: 500 as const,
  },
};
