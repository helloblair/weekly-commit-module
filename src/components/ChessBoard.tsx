import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WeeklyCommit, PlanStatus, ChessCategory } from '../types/domain';
import { PlanStatus as PlanStatusEnum } from '../types/domain';
import { updateCommit } from '../api/client';

// --- Props ---

interface ChessBoardProps {
  planId: string;
  commits: WeeklyCommit[];
  planStatus: PlanStatus;
  onCommitsReordered: (updatedCommits: WeeklyCommit[]) => void;
}

// --- Constants ---

const CONTAINER_UNCATEGORIZED = 'uncategorized' as const;
type ContainerId = ChessCategory | typeof CONTAINER_UNCATEGORIZED;

const CATEGORIES: ChessCategory[] = ['KING', 'QUEEN', 'ROOK', 'KNIGHT', 'PAWN'];

const COLUMN_META: Record<ChessCategory, { label: string; color: string; bg: string; tint: string }> = {
  KING: { label: 'King', color: '#b71c1c', bg: '#ffebee', tint: '#fff5f5' },
  QUEEN: { label: 'Queen', color: '#4a148c', bg: '#f3e5f5', tint: '#faf5ff' },
  ROOK: { label: 'Rook', color: '#0d47a1', bg: '#e3f2fd', tint: '#f0f7ff' },
  KNIGHT: { label: 'Knight', color: '#1b5e20', bg: '#e8f5e9', tint: '#f2faf3' },
  PAWN: { label: 'Pawn', color: '#616161', bg: '#f5f5f5', tint: '#fafafa' },
};

// --- Helpers ---

type GroupedCommits = Record<ContainerId, WeeklyCommit[]>;

function groupCommitsByCategory(commits: WeeklyCommit[]): GroupedCommits {
  const groups: GroupedCommits = {
    uncategorized: [],
    KING: [],
    QUEEN: [],
    ROOK: [],
    KNIGHT: [],
    PAWN: [],
  };
  for (const commit of commits) {
    const key: ContainerId = commit.chessCategory ?? CONTAINER_UNCATEGORIZED;
    groups[key].push(commit);
  }
  // Sort categorized columns by priorityRank
  for (const cat of CATEGORIES) {
    groups[cat].sort((a, b) => (a.priorityRank ?? Infinity) - (b.priorityRank ?? Infinity));
  }
  return groups;
}

function findContainer(itemId: string, groups: GroupedCommits): ContainerId | undefined {
  if (itemId === CONTAINER_UNCATEGORIZED || (CATEGORIES as string[]).includes(itemId)) {
    return itemId as ContainerId;
  }
  for (const key of [CONTAINER_UNCATEGORIZED, ...CATEGORIES] as ContainerId[]) {
    if (groups[key].some((c) => c.id === itemId)) {
      return key;
    }
  }
  return undefined;
}

function flattenGroups(groups: GroupedCommits): WeeklyCommit[] {
  const result: WeeklyCommit[] = [];
  result.push(...groups.uncategorized.map((c) => ({ ...c, chessCategory: null, priorityRank: null })));
  for (const cat of CATEGORIES) {
    result.push(
      ...groups[cat].map((c, i) => ({
        ...c,
        chessCategory: cat,
        priorityRank: i + 1,
      })),
    );
  }
  return result;
}

function rcdoBreadcrumb(commit: WeeklyCommit): string {
  const count = commit.rcdoLinks.length;
  if (count === 0) return 'No RCDO links';
  return count === 1 ? '1 RCDO link' : `${count} RCDO links`;
}

// --- Sub-components ---

function SortableCard({
  commit,
  disabled,
}: {
  commit: WeeklyCommit;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: commit.id,
    disabled,
  });

  // Inline styles for dynamic drag transform/shadow (spec exception)
  const dynamicStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...cardStyles.card, ...dynamicStyle }}
      {...attributes}
    >
      {!disabled && (
        <div {...listeners} style={cardStyles.dragHandle} title="Drag to reorder">
          &#x2801;&#x2802;&#x2804;
        </div>
      )}
      <div style={cardStyles.cardContent}>
        <div style={cardStyles.cardTitle}>{commit.title}</div>
        <div style={cardStyles.cardBreadcrumb}>{rcdoBreadcrumb(commit)}</div>
      </div>
    </div>
  );
}

function OverlayCard({ commit }: { commit: WeeklyCommit }) {
  return (
    <div style={{ ...cardStyles.card, ...cardStyles.overlayCard }}>
      <div style={cardStyles.dragHandle}>&#x2801;&#x2802;&#x2804;</div>
      <div style={cardStyles.cardContent}>
        <div style={cardStyles.cardTitle}>{commit.title}</div>
        <div style={cardStyles.cardBreadcrumb}>{rcdoBreadcrumb(commit)}</div>
      </div>
    </div>
  );
}

function DroppableColumn({
  id,
  children,
  isOverColumn,
}: {
  id: string;
  children: React.ReactNode;
  isOverColumn: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...columnStyles.dropZone,
        backgroundColor: isOverColumn ? 'rgba(25, 118, 210, 0.06)' : undefined,
        borderColor: isOverColumn ? '#1976d2' : '#e0e0e0',
      }}
    >
      {children}
    </div>
  );
}

// --- Main component ---

export default function ChessBoard({
  planId,
  commits,
  planStatus,
  onCommitsReordered,
}: ChessBoardProps) {
  const isDragDisabled = planStatus !== PlanStatusEnum.DRAFT;

  const initialGroups = useMemo(() => groupCommitsByCategory(commits), [commits]);
  const [groups, setGroups] = useState<GroupedCommits>(initialGroups);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const preDropRef = useRef<GroupedCommits | null>(null);
  const groupsRef = useRef<GroupedCommits>(groups);
  groupsRef.current = groups;

  // Sync local state when commits prop changes (external update)
  useEffect(() => {
    if (!activeId) {
      setGroups(groupCommitsByCategory(commits));
    }
  }, [commits, activeId]);

  const activeCommit = useMemo(() => {
    if (!activeId) return null;
    for (const items of Object.values(groups)) {
      const found = items.find((c) => c.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, groups]);

  // Track which container is being hovered for drop-zone highlighting
  const [overContainerId, setOverContainerId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
      setError(null);
      preDropRef.current = groups;
    },
    [groups],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverContainerId(null);
      return;
    }

    const overId = over.id as string;

    setGroups((prev) => {
      const activeContainer = findContainer(active.id as string, prev);
      const overContainer = findContainer(overId, prev);

      if (!activeContainer || !overContainer) return prev;

      setOverContainerId(overContainer);

      if (activeContainer === overContainer) return prev;

      const activeItem = prev[activeContainer].find((c) => c.id === active.id);
      if (!activeItem) return prev;

      const activeItems = prev[activeContainer].filter((c) => c.id !== active.id);
      const overItems = [...prev[overContainer]];

      // Insert at hover position or end
      const overIndex = overItems.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(insertAt, 0, activeItem);

      return { ...prev, [activeContainer]: activeItems, [overContainer]: overItems };
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverContainerId(null);

      const preDrop = preDropRef.current;
      preDropRef.current = null;

      if (!over || !preDrop) {
        if (preDrop) setGroups(preDrop);
        return;
      }

      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      // Build final state: start from groupsRef (reflects cross-container moves from dragOver)
      const finalGroups: GroupedCommits = {} as GroupedCommits;
      for (const key of [CONTAINER_UNCATEGORIZED, ...CATEGORIES] as ContainerId[]) {
        finalGroups[key] = [...groupsRef.current[key]];
      }

      // Apply within-container reordering on top
      const activeContainer = findContainer(activeIdStr, finalGroups);
      const overContainer = findContainer(overIdStr, finalGroups);

      if (
        activeContainer &&
        overContainer &&
        activeContainer === overContainer &&
        activeIdStr !== overIdStr
      ) {
        const items = finalGroups[activeContainer];
        const oldIndex = items.findIndex((c) => c.id === activeIdStr);
        const newIndex = items.findIndex((c) => c.id === overIdStr);
        if (oldIndex !== -1 && newIndex !== -1) {
          finalGroups[activeContainer] = arrayMove(items, oldIndex, newIndex);
        }
      }

      setGroups(finalGroups);

      // Persist to API
      const originalContainer = findContainer(activeIdStr, preDrop);
      const currentContainer = findContainer(activeIdStr, finalGroups);

      if (!originalContainer || !currentContainer) return;

      setSaving(true);
      try {
        // If category changed, update the commit
        if (originalContainer !== currentContainer) {
          const commit = finalGroups[currentContainer].find((c) => c.id === activeIdStr);
          if (commit) {
            const newCategory =
              currentContainer === CONTAINER_UNCATEGORIZED
                ? null
                : (currentContainer as ChessCategory);
            await updateCommit(commit.id, {
              chessCategory: newCategory,
              rcdoLinks: commit.rcdoLinks,
            });
          }
        }

        // Batch-update priority_rank for affected columns
        const affectedContainers = new Set<ContainerId>();
        affectedContainers.add(currentContainer);
        if (originalContainer !== currentContainer) {
          affectedContainers.add(originalContainer);
        }

        for (const containerId of affectedContainers) {
          if (containerId === CONTAINER_UNCATEGORIZED) continue;
          const columnItems = finalGroups[containerId];
          await Promise.all(
            columnItems.map((c, index) => updateCommit(c.id, { priorityRank: index + 1 })),
          );
        }

        onCommitsReordered(flattenGroups(finalGroups));
      } catch {
        setGroups(preDrop);
        setError('Failed to update commit. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [onCommitsReordered],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverContainerId(null);
    if (preDropRef.current) {
      setGroups(preDropRef.current);
      preDropRef.current = null;
    }
  }, []);

  if (commits.length === 0) {
    return <div style={boardStyles.empty}>No commits yet. Create a commit to get started.</div>;
  }

  return (
    <div style={boardStyles.container}>
      {error && (
        <div style={boardStyles.error}>
          {error}
          <button
            type="button"
            style={boardStyles.errorDismiss}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {saving && <div style={boardStyles.savingBanner}>Saving changes...</div>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Uncategorized section */}
        {groups.uncategorized.length > 0 && (
          <div style={boardStyles.uncategorizedSection}>
            <h3 style={boardStyles.uncategorizedHeader}>
              Uncategorized
              <span style={boardStyles.commitCount}>
                {groups.uncategorized.length} commit{groups.uncategorized.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <DroppableColumn
              id={CONTAINER_UNCATEGORIZED}
              isOverColumn={overContainerId === CONTAINER_UNCATEGORIZED}
            >
              <SortableContext
                items={groups.uncategorized.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {groups.uncategorized.map((commit) => (
                  <SortableCard key={commit.id} commit={commit} disabled={isDragDisabled} />
                ))}
              </SortableContext>
            </DroppableColumn>
          </div>
        )}

        {/* Category columns */}
        <div style={boardStyles.columnsRow}>
          {CATEGORIES.map((cat) => {
            const meta = COLUMN_META[cat];
            const items = groups[cat];
            return (
              <div key={cat} style={{ ...columnStyles.column, backgroundColor: meta.tint }}>
                <div style={columnStyles.header}>
                  <span style={{ ...columnStyles.headerLabel, color: meta.color }}>{meta.label}</span>
                  <span style={columnStyles.countBadge}>
                    {items.length} commit{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <DroppableColumn id={cat} isOverColumn={overContainerId === cat}>
                  <SortableContext
                    items={items.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.length === 0 && (
                      <div style={columnStyles.emptyHint}>
                        Drag commits here
                      </div>
                    )}
                    {items.map((commit) => (
                      <SortableCard key={commit.id} commit={commit} disabled={isDragDisabled} />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeCommit ? <OverlayCard commit={activeCommit} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// --- Styles ---

const boardStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  empty: {
    padding: '32px',
    textAlign: 'center' as const,
    color: '#888',
    fontSize: '14px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#ffebee',
    border: '1px solid #ef9a9a',
    borderRadius: '6px',
    color: '#c62828',
    fontSize: '13px',
  },
  errorDismiss: {
    padding: '4px 10px',
    border: '1px solid #ef9a9a',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#c62828',
    cursor: 'pointer' as const,
    fontSize: '12px',
  },
  savingBanner: {
    padding: '8px 16px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '6px',
    color: '#1565c0',
    fontSize: '13px',
    textAlign: 'center' as const,
  },
  uncategorizedSection: {
    marginBottom: '8px',
  },
  uncategorizedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: 600 as const,
    color: '#555',
  },
  commitCount: {
    fontSize: '12px',
    fontWeight: 400 as const,
    color: '#999',
  },
  columnsRow: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto' as const,
  },
};

const columnStyles = {
  column: {
    flex: '1 1 0',
    minWidth: '180px',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  headerLabel: {
    fontSize: '14px',
    fontWeight: 600 as const,
  },
  countBadge: {
    fontSize: '11px',
    color: '#888',
  },
  dropZone: {
    flex: 1,
    minHeight: '60px',
    borderRadius: '6px',
    border: '2px dashed #e0e0e0',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    transition: 'background-color 150ms, border-color 150ms',
  },
  emptyHint: {
    padding: '16px',
    textAlign: 'center' as const,
    color: '#bbb',
    fontSize: '12px',
  },
};

const cardStyles = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'default' as const,
  },
  overlayCard: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    cursor: 'grabbing' as const,
  },
  dragHandle: {
    cursor: 'grab' as const,
    color: '#bbb',
    fontSize: '14px',
    lineHeight: '1',
    userSelect: 'none' as const,
    padding: '2px 0',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 500 as const,
    color: '#1a1a1a',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  cardBreadcrumb: {
    fontSize: '11px',
    color: '#888',
    marginTop: '2px',
  },
};
