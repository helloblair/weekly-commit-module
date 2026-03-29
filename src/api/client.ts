import axios from 'axios';
import type {
  RCDOHierarchy,
  WeeklyPlan,
  WeeklyCommit,
  CommitFormData,
  ReconciliationData,
} from '../types/domain';

// Stub — will be replaced with real auth in Phase 6
function getAuthToken(): string {
  return '';
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
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

export async function updateCommit(commitId: string, formData: Partial<CommitFormData>): Promise<WeeklyCommit> {
  const { data } = await api.put<WeeklyCommit>(`/api/v1/commits/${commitId}`, formData);
  return data;
}

export async function deleteCommit(commitId: string): Promise<void> {
  await api.delete(`/api/v1/commits/${commitId}`);
}

// --- Reconciliation ---
export async function submitReconciliation(planId: string, submissions: ReconciliationData[]): Promise<void> {
  await api.post(`/api/v1/plans/${planId}/complete-reconciliation`, submissions);
}
