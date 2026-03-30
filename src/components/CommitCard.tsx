import React from 'react';
import type { WeeklyCommit, PlanStatus, RCDOHierarchy } from '../types/domain';
import { PlanStatus as PlanStatusEnum } from '../types/domain';
import { useTheme, chessTheme } from '../theme';

interface CommitCardProps {
  commit: WeeklyCommit;
  planStatus: PlanStatus;
  hierarchy?: RCDOHierarchy;
  onEdit: (commit: WeeklyCommit) => void;
  onDelete: (commitId: string) => void;
}

const styles = {
  card: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    boxShadow: 'var(--shadow)',
    transition: 'background-color 200ms ease, border-color 200ms ease',
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
    color: 'var(--text)',
    margin: 0,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  breadcrumb: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  breadcrumbSeparator: {
    margin: '0 4px',
    color: 'var(--text-muted)',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  actionButton: {
    padding: '4px 10px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer' as const,
    fontSize: '13px',
    color: 'var(--text-secondary)',
    transition: 'all 150ms ease',
  },
  deleteButton: {
    padding: '4px 10px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer' as const,
    fontSize: '13px',
    color: 'var(--error)',
    transition: 'all 150ms ease',
  },
  carriedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500 as const,
    color: 'var(--primary)',
    backgroundColor: 'var(--primary-bg)',
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
  const { mode } = useTheme();
  const isDraft = planStatus === PlanStatusEnum.DRAFT;
  const chessMeta = commit.chessCategory ? chessTheme(commit.chessCategory, mode) : null;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>{commit.title}</h3>
        {chessMeta && (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            color: chessMeta.color,
            backgroundColor: chessMeta.bg,
            whiteSpace: 'nowrap' as const,
            flexShrink: 0,
          }}>
            {chessMeta.label}
          </span>
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
