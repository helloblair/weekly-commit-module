// ─── Enums ───────────────────────────────────────────────

export type PlanStatus = "DRAFT" | "LOCKED" | "RECONCILING" | "RECONCILED";

export type ChessCategory = "KING" | "QUEEN" | "ROOK" | "KNIGHT" | "PAWN";

export type CompletionStatus =
  | "COMPLETED"
  | "PARTIAL"
  | "NOT_STARTED"
  | "BLOCKED";

export type SnapshotType = "LOCKED" | "RECONCILED";

// ─── RCDO hierarchy ──────────────────────────────────────

export interface RallyCry {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  definingObjectives: DefiningObjective[];
}

export interface DefiningObjective {
  id: string;
  rallyCryId: string;
  title: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  definingObjectiveId: string;
  title: string;
  description: string | null;
  measurableTarget: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Weekly Plan & Commits ───────────────────────────────

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekOf: string;
  status: PlanStatus;
  lockedAt: string | null;
  reconciliationStartedAt: string | null;
  reconciledAt: string | null;
  createdAt: string;
  updatedAt: string;
  commits: WeeklyCommit[];
}

export interface WeeklyCommit {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  chessCategory: ChessCategory | null;
  priorityRank: number | null;
  completionStatus: CompletionStatus | null;
  actualOutcome: string | null;
  blockerNotes: string | null;
  carriedFromId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rcdoLinks: CommitRcdoLink[];
}

export interface CommitRcdoLink {
  id: string;
  commitId: string;
  rallyCryId: string;
  definingObjectiveId: string;
  outcomeId: string;
  createdAt: string;
}

// ─── Snapshots ───────────────────────────────────────────

export interface CommitSnapshot {
  id: string;
  commitId: string;
  snapshotType: SnapshotType;
  title: string;
  description: string | null;
  chessCategory: ChessCategory | null;
  priorityRank: number | null;
  rcdoLinks: CommitRcdoLink[];
  createdAt: string;
}
