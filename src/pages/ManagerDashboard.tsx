import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  TeamRollup,
  TeamMemberSummary,
  RCDOCoverage,
  RallyCryCoverage,
  DefiningObjectiveCoverage,
  OutcomeCoverage,
  CompletionStatus,
  ChessCategory,
  PlanStatus,
} from '../types/domain';
import { fetchTeamRollup, fetchRcdoCoverage } from '../api/client';
import { useTheme, completionTheme, planStatusTheme, chessTheme } from '../theme';

interface ManagerDashboardProps {
  managerId: string;
  orgId: string;
}

// ---- date helpers (shared pattern with WeeklyCommitPage) ----

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
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
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = monday.toLocaleDateString('en-US', opts);
  const endOpts: Intl.DateTimeFormatOptions =
    monday.getMonth() === sunday.getMonth()
      ? { day: 'numeric' }
      : { month: 'short', day: 'numeric' };
  const end = sunday.toLocaleDateString('en-US', endOpts);
  return `${start} – ${end}, ${String(monday.getFullYear())}`;
}

// ---- constants ----

type TabId = 'team' | 'coverage';

const CHESS_LABELS: Record<ChessCategory, string> = {
  KING: 'King', QUEEN: 'Queen', ROOK: 'Rook', KNIGHT: 'Knight', PAWN: 'Pawn',
};

// ---- filters ----

interface Filters {
  memberId: string;
  chessCategory: string;
  completionStatus: string;
}

const EMPTY_FILTERS: Filters = { memberId: '', chessCategory: '', completionStatus: '' };

// ---- main component ----

export default function ManagerDashboard({ managerId, orgId }: ManagerDashboardProps) {
  const { mode } = useTheme();
  const [weekMonday, setWeekMonday] = useState(() => getMondayOfWeek(new Date()));
  const [rollup, setRollup] = useState<TeamRollup | null>(null);
  const [coverage, setCoverage] = useState<RCDOCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('team');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const weekOf = toISODate(weekMonday);
      const [r, c] = await Promise.all([
        fetchTeamRollup(managerId, weekOf),
        fetchRcdoCoverage(managerId, orgId, weekOf),
      ]);
      setRollup(r);
      setCoverage(c);
    } catch {
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [weekMonday, managerId, orgId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Aggregate stats
  const teamStats = useMemo(() => {
    if (!rollup) return { total: 0, completed: 0, partial: 0, notStarted: 0, blocked: 0 };
    return rollup.teamMembers.reduce(
      (acc, m) => ({
        total: acc.total + m.stats.total,
        completed: acc.completed + m.stats.completed,
        partial: acc.partial + m.stats.partial,
        notStarted: acc.notStarted + m.stats.notStarted,
        blocked: acc.blocked + m.stats.blocked,
      }),
      { total: 0, completed: 0, partial: 0, notStarted: 0, blocked: 0 },
    );
  }, [rollup]);

  // Uncovered outcomes count
  const uncoveredCount = useMemo(() => {
    if (!coverage) return 0;
    let count = 0;
    for (const rc of coverage.rallyCries) {
      for (const dobj of rc.definingObjectives) {
        for (const o of dobj.outcomes) {
          if (!o.covered) count++;
        }
      }
    }
    return count;
  }, [coverage]);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Team Dashboard</h1>
        <div style={s.weekNav}>
          <button type="button" style={s.navBtn} onClick={() => { setWeekMonday((p) => addWeeks(p, -1)); }}>&lsaquo;</button>
          <span style={s.weekLabel}>{formatWeekLabel(weekMonday)}</span>
          <button type="button" style={s.navBtn} onClick={() => { setWeekMonday((p) => addWeeks(p, 1)); }}>&rsaquo;</button>
        </div>
      </div>

      {/* Aggregate stats bar */}
      {rollup && (
        <div style={s.statsBar}>
          <StatCard label="Total Commits" value={teamStats.total} color="var(--text)" />
          <StatCard label="Completed" value={teamStats.completed} color={completionTheme('COMPLETED', mode).color} />
          <StatCard label="Partial" value={teamStats.partial} color={completionTheme('PARTIAL', mode).color} />
          <StatCard label="Not Started" value={teamStats.notStarted} color={completionTheme('NOT_STARTED', mode).color} />
          <StatCard label="Blocked" value={teamStats.blocked} color={completionTheme('BLOCKED', mode).color} />
          {uncoveredCount > 0 && (
            <StatCard label="Uncovered Outcomes" value={uncoveredCount} color="var(--error)" />
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          type="button"
          style={tab === 'team' ? s.tabActive : s.tab}
          onClick={() => { setTab('team'); }}
        >
          Team Roll-Up
        </button>
        <button
          type="button"
          style={tab === 'coverage' ? s.tabActive : s.tab}
          onClick={() => { setTab('coverage'); }}
        >
          RCDO Coverage
        </button>
      </div>

      {error && (
        <div style={s.error}>
          {error}
          <button type="button" style={s.retryBtn} onClick={() => { void loadData(); }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={s.loading}>Loading team data...</div>
      ) : tab === 'team' && rollup ? (
        <TeamRollupView
          rollup={rollup}
          filters={filters}
          onFiltersChange={setFilters}
          expandedMember={expandedMember}
          onToggleMember={setExpandedMember}
        />
      ) : tab === 'coverage' && coverage ? (
        <RCDOCoverageView coverage={coverage} />
      ) : null}
    </div>
  );
}

// ---- stat card ----

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

// ---- team rollup view ----

function TeamRollupView({
  rollup,
  filters,
  onFiltersChange,
  expandedMember,
  onToggleMember,
}: {
  rollup: TeamRollup;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  expandedMember: string | null;
  onToggleMember: (id: string | null) => void;
}) {
  const uniqueMembers = rollup.teamMembers;

  return (
    <div style={s.section}>
      {/* Filter bar */}
      <div style={s.filterBar}>
        <select
          style={s.filterSelect}
          value={filters.memberId}
          onChange={(e) => { onFiltersChange({ ...filters, memberId: e.target.value }); }}
        >
          <option value="">All Members</option>
          {uniqueMembers.map((m) => (
            <option key={m.userId} value={m.userId}>{m.name}</option>
          ))}
        </select>
        <select
          style={s.filterSelect}
          value={filters.chessCategory}
          onChange={(e) => { onFiltersChange({ ...filters, chessCategory: e.target.value }); }}
        >
          <option value="">All Categories</option>
          {(['KING', 'QUEEN', 'ROOK', 'KNIGHT', 'PAWN'] as const).map((c) => (
            <option key={c} value={c}>{CHESS_LABELS[c]}</option>
          ))}
        </select>
        <select
          style={s.filterSelect}
          value={filters.completionStatus}
          onChange={(e) => { onFiltersChange({ ...filters, completionStatus: e.target.value }); }}
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PARTIAL">Partial</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        {(filters.memberId || filters.chessCategory || filters.completionStatus) && (
          <button type="button" style={s.clearBtn} onClick={() => { onFiltersChange(EMPTY_FILTERS); }}>
            Clear
          </button>
        )}
      </div>

      {/* Member cards */}
      <div style={s.memberList}>
        {uniqueMembers
          .filter((m) => !filters.memberId || m.userId === filters.memberId)
          .map((member) => {
            const isExpanded = expandedMember === member.userId;
            const filteredCommits = member.commits.filter((c) => {
              if (filters.chessCategory && c.chessCategory !== filters.chessCategory) return false;
              if (filters.completionStatus && c.completionStatus !== filters.completionStatus) return false;
              return true;
            });

            return (
              <MemberCard
                key={member.userId}
                member={member}
                filteredCommits={filteredCommits}
                isExpanded={isExpanded}
                onToggle={() => { onToggleMember(isExpanded ? null : member.userId); }}
              />
            );
          })}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  filteredCommits,
  isExpanded,
  onToggle,
}: {
  member: TeamMemberSummary;
  filteredCommits: TeamMemberSummary['commits'];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { mode } = useTheme();
  const statusMeta = planStatusTheme(member.planStatus, mode);
  const pct = member.stats.total > 0
    ? Math.round((member.stats.completed / member.stats.total) * 100)
    : 0;

  return (
    <div style={s.memberCard}>
      <div style={s.memberHeader} onClick={onToggle} role="button" tabIndex={0}>
        <div style={s.memberLeft}>
          <span style={s.memberName}>{member.name}</span>
          <span style={{ ...s.statusBadge, color: statusMeta.color, backgroundColor: statusMeta.bg }}>
            {member.planStatus}
          </span>
        </div>
        <div style={s.memberRight}>
          <span style={s.memberPct}>{pct}%</span>
          <span style={s.memberStats}>
            {member.stats.completed}/{member.stats.total} done
          </span>
          <span style={s.expandIcon}>{isExpanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={s.progressBar}>
        {member.stats.total > 0 && (
          <>
            <div style={{ ...s.progressSegment, width: String((member.stats.completed / member.stats.total) * 100) + '%', backgroundColor: completionTheme('COMPLETED', mode).color }} />
            <div style={{ ...s.progressSegment, width: String((member.stats.partial / member.stats.total) * 100) + '%', backgroundColor: completionTheme('PARTIAL', mode).color }} />
            <div style={{ ...s.progressSegment, width: String((member.stats.blocked / member.stats.total) * 100) + '%', backgroundColor: completionTheme('BLOCKED', mode).color }} />
          </>
        )}
      </div>

      {/* Expanded commit list */}
      {isExpanded && (
        <div style={s.commitTable}>
          {filteredCommits.length === 0 ? (
            <div style={s.emptyRow}>No commits match filters</div>
          ) : (
            filteredCommits.map((c) => {
              const compMeta = c.completionStatus ? completionTheme(c.completionStatus, mode) : null;
              return (
                <div key={c.id} style={s.commitRow}>
                  <span style={s.commitTitle}>{c.title}</span>
                  {c.chessCategory && (
                    <span style={{
                      ...s.chessBadge,
                      color: chessTheme(c.chessCategory, mode).color,
                      backgroundColor: chessTheme(c.chessCategory, mode).bg,
                    }}>
                      {CHESS_LABELS[c.chessCategory]}
                    </span>
                  )}
                  {compMeta && (
                    <span style={{ ...s.completionBadge, color: compMeta.color }}>
                      {compMeta.label}
                    </span>
                  )}
                  {c.rcdoPath && (
                    <span style={s.rcdoPath}>{c.rcdoPath}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ---- RCDO coverage view ----

function RCDOCoverageView({ coverage }: { coverage: RCDOCoverage }) {
  return (
    <div style={s.section}>
      <p style={s.coverageSubtitle}>
        Outcomes with no team commits are flagged as uncovered.
      </p>
      <div style={s.coverageTree}>
        {coverage.rallyCries.map((rc) => (
          <RallyCryNode key={rc.id} node={rc} />
        ))}
      </div>
    </div>
  );
}

function RallyCryNode({ node }: { node: RallyCryCoverage }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={s.treeNode}>
      <div style={s.treeRow} onClick={() => { setOpen(!open); }} role="button" tabIndex={0}>
        <span style={s.treeToggle}>{open ? '▾' : '▸'}</span>
        <span style={s.treeLabel}>{node.title}</span>
        {!node.covered && <span style={s.uncoveredBadge}>Uncovered</span>}
      </div>
      {open && node.definingObjectives.map((dobj) => (
        <DefiningObjectiveNode key={dobj.id} node={dobj} />
      ))}
    </div>
  );
}

function DefiningObjectiveNode({ node }: { node: DefiningObjectiveCoverage }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...s.treeNode, marginLeft: '20px' }}>
      <div style={s.treeRow} onClick={() => { setOpen(!open); }} role="button" tabIndex={0}>
        <span style={s.treeToggle}>{open ? '▾' : '▸'}</span>
        <span style={s.treeLabel}>{node.title}</span>
        {!node.covered && <span style={s.uncoveredBadge}>Uncovered</span>}
      </div>
      {open && node.outcomes.map((o) => (
        <OutcomeNode key={o.id} node={o} />
      ))}
    </div>
  );
}

function OutcomeNode({ node }: { node: OutcomeCoverage }) {
  const { mode } = useTheme();
  const [open, setOpen] = useState(false);
  const pct = Math.round(node.completionRate * 100);

  return (
    <div style={{ ...s.treeNode, marginLeft: '40px' }}>
      <div style={s.treeRow} onClick={() => { setOpen(!open); }} role="button" tabIndex={0}>
        <span style={s.treeToggle}>{node.commits.length > 0 ? (open ? '▾' : '▸') : ' '}</span>
        <span style={{
          ...s.treeLabel,
          color: node.covered ? 'var(--text)' : 'var(--error)',
          fontWeight: node.covered ? 400 : 600,
        }}>
          {node.title}
        </span>
        {node.covered ? (
          <span style={s.coveragePct}>{pct}% complete ({node.commits.length} commit{node.commits.length !== 1 ? 's' : ''})</span>
        ) : (
          <span style={s.uncoveredBadge}>No coverage</span>
        )}
      </div>
      {open && node.commits.length > 0 && (
        <div style={s.outcomeCommits}>
          {node.commits.map((c) => {
            const compMeta = c.completionStatus ? completionTheme(c.completionStatus, mode) : null;
            return (
              <div key={c.commitId} style={s.outcomeCommitRow}>
                <span style={s.ocMember}>{c.memberName}</span>
                <span style={s.ocTitle}>{c.commitTitle}</span>
                {compMeta && (
                  <span style={{ ...s.completionBadge, color: compMeta.color }}>
                    {compMeta.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- styles ----

const s = {
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700 as const,
    color: 'var(--text)',
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navBtn: {
    padding: '6px 10px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer' as const,
    fontSize: '16px',
    lineHeight: 1,
    color: 'var(--text-secondary)',
    transition: 'all 150ms ease',
  },
  weekLabel: {
    fontSize: '15px',
    fontWeight: 600 as const,
    color: 'var(--text)',
    minWidth: '180px',
    textAlign: 'center' as const,
  },
  statsBar: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  statCard: {
    flex: '1 1 0',
    minWidth: '90px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
    backgroundColor: 'var(--bg-surface)',
    boxShadow: 'var(--shadow)',
    transition: 'background-color 200ms ease, border-color 200ms ease',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700 as const,
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  tabs: {
    display: 'flex',
    gap: '0px',
    borderBottom: '2px solid var(--border)',
    marginBottom: '16px',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
    color: 'var(--text-secondary)',
    marginBottom: '-2px',
    transition: 'color 150ms ease',
  },
  tabActive: {
    padding: '10px 20px',
    border: 'none',
    borderBottom: '2px solid var(--primary)',
    backgroundColor: 'transparent',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: 600 as const,
    color: 'var(--primary)',
    marginBottom: '-2px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error-text)',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  retryBtn: {
    padding: '4px 12px',
    border: '1px solid var(--error-border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--error)',
    cursor: 'pointer' as const,
    fontSize: '12px',
    transition: 'all 150ms ease',
  },
  loading: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '14px',
    padding: '48px 16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  // Filter bar
  filterBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  filterSelect: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid var(--input-border)',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '13px',
    transition: 'border-color 150ms ease',
  },
  clearBtn: {
    padding: '6px 12px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer' as const,
    fontSize: '12px',
    color: 'var(--text-secondary)',
    transition: 'all 150ms ease',
  },
  // Member cards
  memberList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  memberCard: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-surface)',
    overflow: 'hidden' as const,
    boxShadow: 'var(--shadow)',
    transition: 'background-color 200ms ease, border-color 200ms ease',
  },
  memberHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer' as const,
    gap: '8px',
  },
  memberLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: '15px',
    fontWeight: 600 as const,
    color: 'var(--text)',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500 as const,
  },
  memberRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  memberPct: {
    fontSize: '16px',
    fontWeight: 700 as const,
    color: 'var(--text)',
  },
  memberStats: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  expandIcon: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  progressBar: {
    display: 'flex',
    height: '4px',
    backgroundColor: 'var(--bg-inset)',
  },
  progressSegment: {
    height: '100%',
    transition: 'width 300ms ease',
  },
  // Commit table (expanded)
  commitTable: {
    padding: '0 16px 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  commitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 0',
    borderBottom: '1px solid var(--border-subtle)',
    flexWrap: 'wrap' as const,
  },
  commitTitle: {
    fontSize: '13px',
    color: 'var(--text)',
    flex: 1,
    minWidth: 0,
  },
  chessBadge: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  completionBadge: {
    fontSize: '11px',
    fontWeight: 500 as const,
  },
  rcdoPath: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    maxWidth: '200px',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  emptyRow: {
    padding: '12px 0',
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  // RCDO coverage tree
  coverageSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  coverageTree: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  treeNode: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  treeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 4px',
    cursor: 'pointer' as const,
    borderRadius: '4px',
  },
  treeToggle: {
    width: '14px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    flexShrink: 0,
    textAlign: 'center' as const,
  },
  treeLabel: {
    fontSize: '14px',
    color: 'var(--text)',
  },
  uncoveredBadge: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500 as const,
    color: 'var(--error)',
    backgroundColor: 'var(--error-bg)',
  },
  coveragePct: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  outcomeCommits: {
    marginLeft: '20px',
    paddingLeft: '12px',
    borderLeft: '2px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  outcomeCommitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    fontSize: '13px',
  },
  ocMember: {
    fontWeight: 500 as const,
    color: 'var(--text-secondary)',
    minWidth: '80px',
  },
  ocTitle: {
    color: 'var(--text)',
    flex: 1,
    minWidth: 0,
  },
};
