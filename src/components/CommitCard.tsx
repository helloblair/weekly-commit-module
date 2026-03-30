import React from 'react';
import type { WeeklyCommit, PlanStatus, RCDOHierarchy, ChessCategory } from '../types/domain';
import { PlanStatus as PlanStatusEnum } from '../types/domain';

interface CommitCardProps {
  commit: WeeklyCommit;
  planStatus: PlanStatus;
  hierarchy?: RCDOHierarchy;
  onEdit: (commit: WeeklyCommit) => void;
  onDelete: (commitId: string) => void;
}

const CHESS_LABELS: Record<ChessCategory, { label: string; color: string; bg: string }> = {
  KING: { label: 'King', color: '#b71c1c', bg: '#ffebee' },
  QUEEN: { label: 'Queen', color: '#4a148c', bg: '#f3e5f5' },
  ROOK: { label: 'Rook', color: '#0d47a1', bg: '#e3f2fd' },
  KNIGHT: { label: 'Knight', color: '#1b5e20', bg: '#e8f5e9' },
  PAWN: { label: 'Pawn', color: '#616161', bg: '#f5f5f5' },
};

const styles = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600 as const,
    color: '#1a1a1a',
    margin: 0,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  badge: (color: string, bg: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500 as const,
    color,
    backgroundColor: bg,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }),
  breadcrumb: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.4,
  },
  breadcrumbSeparator: {
    margin: '0 4px',
    color: '#bbb',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  actionButton: {
    padding: '4px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer' as const,
    fontSize: '13px',
    color: '#333',
  },
  deleteButton: {
    padding: '4px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer' as const,
    fontSize: '13px',
    color: '#d32f2f',
  },
  carriedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500 as const,
    color: '#1565c0',
    backgroundColor: '#e3f2fd',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
};

function resolveBreadcrumb(
  link: { rallyCryId: string; definingObjectiveId: string; outcomeId: string },
  hierarchy?: RCDOHierarchy,
): string[] {
  if (!hierarchy) {
    return [link.rallyCryId, link.definingObjectiveId, link.outcomeId];
  }
  const rc = hierarchy.rallyCries.find((r) => r.id === link.rallyCryId);
  const rcTitle = rc?.title ?? link.rallyCryId;
  const dobj = rc?.definingObjectives.find((d) => d.id === link.definingObjectiveId);
  const doTitle = dobj?.title ?? link.definingObjectiveId;
  const outcome = dobj?.outcomes.find((o) => o.id === link.outcomeId);
  const oTitle = outcome?.title ?? link.outcomeId;
  return [rcTitle, doTitle, oTitle];
}

export default function CommitCard({
  commit,
  planStatus,
  hierarchy,
  onEdit,
  onDelete,
}: CommitCardProps) {
  const isDraft = planStatus === PlanStatusEnum.DRAFT;
  const chessMeta = commit.chessCategory ? CHESS_LABELS[commit.chessCategory] : null;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>{commit.title}</h3>
        {chessMeta && (
          <span style={styles.badge(chessMeta.color, chessMeta.bg)}>{chessMeta.label}</span>
        )}
        {commit.carriedFromId && (
          <span style={styles.carriedBadge}>Carried forward</span>
        )}
      </div>

      {commit.rcdoLinks.length > 0 && (
        <div style={styles.breadcrumb}>
          {commit.rcdoLinks.map((link, i) => {
            const parts = resolveBreadcrumb(link, hierarchy);
            return (
              <div key={i}>
                {parts.map((part, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <span style={styles.breadcrumbSeparator}>&rsaquo;</span>}
                    <span>{part}</span>
                  </React.Fragment>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {isDraft && (
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.actionButton}
            onClick={() => onEdit(commit)}
          >
            Edit
          </button>
          <button
            type="button"
            style={styles.deleteButton}
            onClick={() => onDelete(commit.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
