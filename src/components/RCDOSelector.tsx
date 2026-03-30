import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RCDOLink, RCDOHierarchy } from '../types/domain';
import { fetchRCDOHierarchy } from '../api/client';

interface RCDOSelectorProps {
  orgId: string;
  initialLinks?: RCDOLink[];
  onChange: (links: RCDOLink[]) => void;
  disabled?: boolean;
}

interface LinkRow {
  rallyCryId: string;
  definingObjectiveId: string;
  outcomeId: string;
}

const emptyRow = (): LinkRow => ({
  rallyCryId: '',
  definingObjectiveId: '',
  outcomeId: '',
});

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--input-border)',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    minWidth: '180px',
    transition: 'border-color 150ms ease',
  },
  selectDisabled: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--input-disabled-bg)',
    color: 'var(--input-disabled-text)',
    fontSize: '14px',
    minWidth: '180px',
    cursor: 'not-allowed' as const,
  },
  arrow: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    userSelect: 'none' as const,
  },
  removeButton: {
    padding: '6px 10px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer' as const,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    transition: 'all 150ms ease',
  },
  addButton: {
    padding: '8px 16px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer' as const,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    alignSelf: 'flex-start' as const,
    transition: 'all 150ms ease',
  },
  addButtonDisabled: {
    padding: '8px 16px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--input-disabled-bg)',
    cursor: 'not-allowed' as const,
    fontSize: '14px',
    color: 'var(--input-disabled-text)',
    alignSelf: 'flex-start' as const,
  },
  spinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--error)',
    fontSize: '14px',
  },
  retryButton: {
    padding: '4px 12px',
    border: '1px solid var(--error)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--error)',
    cursor: 'pointer' as const,
    fontSize: '13px',
    transition: 'all 150ms ease',
  },
  empty: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontStyle: 'italic' as const,
  },
};

function isRowComplete(row: LinkRow): boolean {
  return row.rallyCryId !== '' && row.definingObjectiveId !== '' && row.outcomeId !== '';
}

function toRCDOLink(row: LinkRow): RCDOLink {
  return {
    rallyCryId: row.rallyCryId,
    definingObjectiveId: row.definingObjectiveId,
    outcomeId: row.outcomeId,
  };
}

export default function RCDOSelector({
  orgId,
  initialLinks,
  onChange,
  disabled = false,
}: RCDOSelectorProps) {
  const [hierarchy, setHierarchy] = useState<RCDOHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LinkRow[]>(() => {
    if (initialLinks && initialLinks.length > 0) {
      return initialLinks.map((link) => ({
        rallyCryId: link.rallyCryId,
        definingObjectiveId: link.definingObjectiveId,
        outcomeId: link.outcomeId,
      }));
    }
    return [emptyRow()];
  });

  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRCDOHierarchy(orgId);
      setHierarchy(data);
    } catch {
      setError('Failed to load strategic goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const emitChange = useCallback(
    (updatedRows: LinkRow[]) => {
      const completeLinks = updatedRows.filter(isRowComplete).map(toRCDOLink);
      onChange(completeLinks);
    },
    [onChange],
  );

  const updateRow = useCallback(
    (index: number, field: keyof LinkRow, value: string) => {
      setRows((prev) => {
        const updated = [...prev];
        const row = { ...updated[index] };

        if (field === 'rallyCryId') {
          row.rallyCryId = value;
          row.definingObjectiveId = '';
          row.outcomeId = '';
        } else if (field === 'definingObjectiveId') {
          row.definingObjectiveId = value;
          row.outcomeId = '';
        } else {
          row.outcomeId = value;
        }

        updated[index] = row;
        emitChange(updated);
        return updated;
      });
    },
    [emitChange],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const removeRow = useCallback(
    (index: number) => {
      setRows((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        emitChange(updated);
        return updated;
      });
    },
    [emitChange],
  );

  const hasIncompleteRow = rows.some((row) => !isRowComplete(row));

  if (loading) {
    return <div style={styles.spinner}>Loading strategic goals...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <span>{error}</span>
        <button type="button" style={styles.retryButton} onClick={loadHierarchy}>
          Retry
        </button>
      </div>
    );
  }

  if (!hierarchy || hierarchy.rallyCries.length === 0) {
    return <div style={styles.empty}>No strategic goals configured</div>;
  }

  return (
    <div style={styles.container}>
      {rows.map((row, index) => (
        <SelectorRow
          key={index}
          row={row}
          hierarchy={hierarchy}
          disabled={disabled}
          canRemove={rows.length > 1}
          onChangeField={(field, value) => updateRow(index, field, value)}
          onRemove={() => removeRow(index)}
        />
      ))}
      <button
        type="button"
        style={disabled || hasIncompleteRow ? styles.addButtonDisabled : styles.addButton}
        disabled={disabled || hasIncompleteRow}
        onClick={addRow}
      >
        + Add link
      </button>
    </div>
  );
}

interface SelectorRowProps {
  row: LinkRow;
  hierarchy: RCDOHierarchy;
  disabled: boolean;
  canRemove: boolean;
  onChangeField: (field: keyof LinkRow, value: string) => void;
  onRemove: () => void;
}

function SelectorRow({
  row,
  hierarchy,
  disabled,
  canRemove,
  onChangeField,
  onRemove,
}: SelectorRowProps) {
  const definingObjectives = useMemo(() => {
    if (!row.rallyCryId) return [];
    const rc = hierarchy.rallyCries.find((rc) => rc.id === row.rallyCryId);
    return rc ? rc.definingObjectives : [];
  }, [hierarchy, row.rallyCryId]);

  const outcomes = useMemo(() => {
    if (!row.definingObjectiveId) return [];
    const dobj = definingObjectives.find((d) => d.id === row.definingObjectiveId);
    return dobj ? dobj.outcomes : [];
  }, [definingObjectives, row.definingObjectiveId]);

  const doDisabled = disabled || !row.rallyCryId;
  const outcomeDisabled = disabled || !row.definingObjectiveId;

  return (
    <div style={styles.row}>
      <select
        style={disabled ? styles.selectDisabled : styles.select}
        disabled={disabled}
        value={row.rallyCryId}
        onChange={(e) => onChangeField('rallyCryId', e.target.value)}
      >
        <option value="">Select Rally Cry</option>
        {hierarchy.rallyCries.map((rc) => (
          <option key={rc.id} value={rc.id}>
            {rc.title}
          </option>
        ))}
      </select>

      <span style={styles.arrow}>&rarr;</span>

      <select
        style={doDisabled ? styles.selectDisabled : styles.select}
        disabled={doDisabled}
        value={row.definingObjectiveId}
        onChange={(e) => onChangeField('definingObjectiveId', e.target.value)}
      >
        <option value="">Select Defining Objective</option>
        {definingObjectives.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </select>

      <span style={styles.arrow}>&rarr;</span>

      <select
        style={outcomeDisabled ? styles.selectDisabled : styles.select}
        disabled={outcomeDisabled}
        value={row.outcomeId}
        onChange={(e) => onChangeField('outcomeId', e.target.value)}
      >
        <option value="">Select Outcome</option>
        {outcomes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>

      {canRemove && (
        <button
          type="button"
          style={styles.removeButton}
          disabled={disabled}
          onClick={onRemove}
        >
          ✕
        </button>
      )}
    </div>
  );
}
