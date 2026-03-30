import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReconciliationView from '../components/ReconciliationView';
import { ThemeProvider } from '../theme';
import type { WeeklyCommit } from '../types/domain';

// Mock the API client
jest.mock('../api/client', () => ({
  submitReconciliation: jest.fn(),
}));

import { submitReconciliation } from '../api/client';
const mockSubmit = submitReconciliation as jest.MockedFunction<typeof submitReconciliation>;

function makeCommit(overrides: Partial<WeeklyCommit> = {}): WeeklyCommit {
  return {
    id: 'c1',
    planId: 'p1',
    title: 'Ship API',
    description: 'REST endpoints',
    chessCategory: 'QUEEN',
    priorityRank: 1,
    actualOutcome: null,
    completionStatus: null,
    blockerNotes: null,
    carriedFromId: null,
    rcdoLinks: [],
    ...overrides,
  };
}

function renderView(commits: WeeklyCommit[] = [makeCommit()], onComplete = jest.fn()) {
  return render(
    <ThemeProvider>
      <ReconciliationView planId="p1" commits={commits} onComplete={onComplete} />
    </ThemeProvider>,
  );
}

describe('ReconciliationView', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
  });

  it('renders heading and commit titles', () => {
    renderView();
    expect(screen.getByText('Weekly Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Ship API')).toBeInTheDocument();
  });

  it('renders completion status buttons', () => {
    renderView();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('shows chess category badge', () => {
    renderView();
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('shows blocker details field when BLOCKED is selected', () => {
    renderView();
    fireEvent.click(screen.getByText('Blocked'));
    expect(screen.getByPlaceholderText('What was the blocker?')).toBeInTheDocument();
  });

  it('shows carry-forward checkbox for PARTIAL, NOT_STARTED, BLOCKED', () => {
    renderView();

    // PARTIAL
    fireEvent.click(screen.getByText('Partial'));
    expect(screen.getByText('Carry forward to next week')).toBeInTheDocument();

    // COMPLETED should hide it
    fireEvent.click(screen.getByText('Completed'));
    expect(screen.queryByText('Carry forward to next week')).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting without required fields', () => {
    renderView();
    fireEvent.click(screen.getByText('Submit Reconciliation'));
    expect(screen.getByText('Select a completion status')).toBeInTheDocument();
    expect(screen.getByText('Actual outcome is required')).toBeInTheDocument();
  });

  it('submits successfully when all fields are filled', async () => {
    mockSubmit.mockResolvedValue(undefined);
    const onComplete = jest.fn();
    renderView([makeCommit()], onComplete);

    fireEvent.click(screen.getByText('Completed'));
    fireEvent.change(screen.getByPlaceholderText('Describe the actual outcome...'), {
      target: { value: 'Shipped on time' },
    });
    fireEvent.click(screen.getByText('Submit Reconciliation'));

    await screen.findByText('Submit Reconciliation'); // wait for async
    expect(mockSubmit).toHaveBeenCalledWith('p1', [
      expect.objectContaining({
        commitId: 'c1',
        completionStatus: 'COMPLETED',
        actualOutcome: 'Shipped on time',
        carryForward: false,
      }),
    ]);
  });
});
