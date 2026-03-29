// --- Enums as const objects ---

export const PlanStatus = {
  DRAFT: 'DRAFT',
  LOCKED: 'LOCKED',
  RECONCILING: 'RECONCILING',
  RECONCILED: 'RECONCILED',
} as const;
export type PlanStatus = typeof PlanStatus[keyof typeof PlanStatus];

export const ChessCategory = {
  KING: 'KING',
  QUEEN: 'QUEEN',
  ROOK: 'ROOK',
  KNIGHT: 'KNIGHT',
  PAWN: 'PAWN',
} as const;
export type ChessCategory = typeof ChessCategory[keyof typeof ChessCategory];

export const CompletionStatus = {
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  NOT_STARTED: 'NOT_STARTED',
  BLOCKED: 'BLOCKED',
} as const;
export type CompletionStatus = typeof CompletionStatus[keyof typeof CompletionStatus];

// --- Domain interfaces ---

export interface RallyCry {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  active: boolean;
}

export interface DefiningObjective {
  id: string;
  rallyCryId: string;
  title: string;
  description: string | null;
  active: boolean;
}

export interface Outcome {
  id: string;
  definingObjectiveId: string;
  title: string;
  description: string | null;
  measurableTarget: string | null;
  active: boolean;
}

// Nested tree structure for the cascading selector
export interface RCDOHierarchy {
  rallyCries: Array<RallyCry & {
    definingObjectives: Array<DefiningObjective & {
      outcomes: Outcome[];
    }>;
  }>;
}

export interface RCDOLink {
  rallyCryId: string;
  definingObjectiveId: string;
  outcomeId: string;
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekOf: string; // ISO date string
  status: PlanStatus;
  lockedAt: string | null;
  reconciliationStartedAt: string | null;
  reconciledAt: string | null;
}

export interface WeeklyCommit {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  chessCategory: ChessCategory | null;
  priorityRank: number | null;
  actualOutcome: string | null;
  completionStatus: CompletionStatus | null;
  blockerNotes: string | null;
  carriedFromId: string | null;
  rcdoLinks: RCDOLink[];
}

export interface CommitFormData {
  title: string;
  description: string | null;
  rcdoLinks: RCDOLink[]; // at least one required
}

export interface ReconciliationData {
  commitId: string;
  completionStatus: CompletionStatus;
  actualOutcome: string;
  blockerNotes: string | null;
  carryForward: boolean;
}

export interface CommitSnapshot {
  id: string;
  commitId: string;
  snapshotType: string;
  title: string;
  description: string | null;
  chessCategory: ChessCategory | null;
  priorityRank: number | null;
  rcdoLinks: RCDOLink[];
}
