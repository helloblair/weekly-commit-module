import React from 'react';
import { render, screen } from '@testing-library/react';
import ReconciledSummary from '../components/ReconciledSummary';
import { ThemeProvider } from '../theme';
import type { WeeklyCommit } from '../types/domain';

function makeCommit(overrides: Partial<WeeklyCommit> = {}): WeeklyCommit {
  return {
    id: Math.random().toString(),
    planId: 'p1',
    title: 'Default commit',
    description: null,
    chessCategory: null,
    priorityRank: null,
    actualOutcome: null,
    completionStatus: null,
    blockerNotes: null,
    carriedFromId: null,
    rcdoLinks: [],
    ...overrides,
  };
}

function renderSummary(commits: WeeklyCommit[]) {
  return render(
    <ThemeProvider>
      <ReconciledSummary commits={commits} />
    </ThemeProvider>,
  );
}

describe('ReconciledSummary', () => {
  it('renders heading', () => {
    renderSummary([]);
    expect(screen.getByText('Week Reconciled')).toBeInTheDocument();
  });

  it('shows completion stats', () => {
    const commits = [
      makeCommit({ id: '1', title: 'A', completionStatus: 'COMPLETED', actualOutcome: 'Done' }),
      makeCommit({ id: '2', title: 'B', completionStatus: 'PARTIAL', actualOutcome: 'Half' }),
      makeCommit({ id: '3', title: 'C', completionStatus: 'BLOCKED', actualOutcome: 'Stuck' }),
    ];
    renderSummary(commits);

    // Stats labels appear (getAllByText since they can appear in both stat card and badge)
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Blocked').length).toBeGreaterThanOrEqual(1);
  });

  it('shows planned vs actual comparison', () => {
    const commits = [
      makeCommit({ title: 'Build SSO', description: 'SAML flow', actualOutcome: 'Shipped SAML' }),
    ];
    renderSummary(commits);

    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('SAML flow')).toBeInTheDocument();
    expect(screen.getByText('Shipped SAML')).toBeInTheDocument();
  });

  it('shows blocker notes when present', () => {
    const commits = [
      makeCommit({
        title: 'Blocked task',
        completionStatus: 'BLOCKED',
        blockerNotes: 'Waiting on data team',
      }),
    ];
    renderSummary(commits);
    expect(screen.getByText('Waiting on data team')).toBeInTheDocument();
  });

  it('shows carried forward badge', () => {
    const commits = [
      makeCommit({ title: 'Carried', carriedFromId: 'old-id' }),
    ];
    renderSummary(commits);
    expect(screen.getByText('Carried forward')).toBeInTheDocument();
  });

  it('shows completion percentage in footer', () => {
    const commits = [
      makeCommit({ id: '1', completionStatus: 'COMPLETED' }),
      makeCommit({ id: '2', completionStatus: 'PARTIAL' }),
    ];
    renderSummary(commits);
    expect(screen.getByText(/1 of 2 commitments completed \(50%\)/)).toBeInTheDocument();
  });
});
