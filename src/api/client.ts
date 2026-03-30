import axios from 'axios';
import type {
  RCDOHierarchy,
  WeeklyPlan,
  WeeklyCommit,
  CommitFormData,
  CommitUpdatePayload,
  ReconciliationData,
  TeamRollup,
  RCDOCoverage,
} from '../types/domain';

// Auth token provider — host app sets this via setAuthTokenProvider()
let tokenProvider: () => string = () => '';

export function setAuthTokenProvider(provider: () => string): void {
  tokenProvider = provider;
}

function getAuthToken(): string {
  return tokenProvider();
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '',
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- RCDO ---
export async function fetchRCDOHierarchy(orgId: string): Promise<RCDOHierarchy> {
  const { data } = await api.get<RCDOHierarchy>(`/api/v1/rcdo/hierarchy`, { params: { orgId } });
  return data;
}

// --- Plans ---
export async function fetchWeeklyPlan(userId: string, weekOf: string): Promise<WeeklyPlan> {
  const { data } = await api.get<WeeklyPlan>(`/api/v1/plans`, { params: { userId, weekOf } });
  return data;
}

export async function transitionPlan(
  planId: string,
  action: 'lock' | 'start-reconciliation' | 'complete-reconciliation'
): Promise<WeeklyPlan> {
  const { data } = await api.post<WeeklyPlan>(`/api/v1/plans/${planId}/${action}`);
  return data;
}

// --- Commits ---
export async function fetchCommits(planId: string): Promise<WeeklyCommit[]> {
  const { data } = await api.get<WeeklyCommit[]>(`/api/v1/plans/${planId}/commits`);
  return data;
}

export async function createCommit(planId: string, formData: CommitFormData): Promise<WeeklyCommit> {
  const { data } = await api.post<WeeklyCommit>(`/api/v1/plans/${planId}/commits`, formData);
  return data;
}

export async function updateCommit(commitId: string, payload: CommitUpdatePayload): Promise<WeeklyCommit> {
  const { data } = await api.put<WeeklyCommit>(`/api/v1/commits/${commitId}`, payload);
  return data;
}

export async function deleteCommit(commitId: string): Promise<void> {
  await api.delete(`/api/v1/commits/${commitId}`);
}

// --- Reconciliation ---
export async function submitReconciliation(planId: string, submissions: ReconciliationData[]): Promise<void> {
  await api.post(`/api/v1/plans/${planId}/complete-reconciliation`, { commits: submissions });
}

// --- Manager ---
export async function fetchTeamRollup(managerId: string, weekOf: string): Promise<TeamRollup> {
  const { data } = await api.get<TeamRollup>(`/api/v1/manager/team-rollup`, {
    params: { managerId, weekOf },
  });
  return data;
}

export async function fetchRcdoCoverage(managerId: string, orgId: string, weekOf: string): Promise<RCDOCoverage> {
  const { data } = await api.get<RCDOCoverage>(`/api/v1/manager/rcdo-coverage`, {
    params: { managerId, orgId, weekOf },
  });
  return data;
}
