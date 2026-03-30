import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommitCard from '../components/CommitCard';
import { ThemeProvider } from '../theme';
import type { WeeklyCommit, RCDOHierarchy } from '../types/domain';

const baseCommit: WeeklyCommit = {
  id: 'c1',
  planId: 'p1',
  title: 'Ship API endpoints',
  description: 'REST endpoints for CRUD',
  chessCategory: null,
  priorityRank: null,
  actualOutcome: null,
  completionStatus: null,
  blockerNotes: null,
  carriedFromId: null,
  rcdoLinks: [
    { rallyCryId: 'rc1', definingObjectiveId: 'do1', outcomeId: 'o1' },
  ],
};

const hierarchy: RCDOHierarchy = {
  rallyCries: [{
    id: 'rc1', orgId: 'org1', title: 'Revenue Growth', description: null, active: true,
    definingObjectives: [{
      id: 'do1', rallyCryId: 'rc1', title: 'Enterprise Tier', description: null, active: true,
      outcomes: [
        { id: 'o1', definingObjectiveId: 'do1', title: 'SSO Complete', description: null, measurableTarget: null, active: true },
      ],
    }],
  }],
};

function renderCard(props: Partial<React.ComponentProps<typeof CommitCard>> = {}) {
  const defaults = {
    commit: baseCommit,
    planStatus: 'DRAFT' as const,
    hierarchy,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };
  return render(
    <ThemeProvider>
      <CommitCard {...defaults} {...props} />
    </ThemeProvider>,
  );
}

describe('CommitCard', () => {
  it('renders commit title', () => {
    renderCard();
    expect(screen.getByText('Ship API endpoints')).toBeInTheDocument();
  });

  it('renders RCDO breadcrumb with resolved titles', () => {
    renderCard();
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Tier')).toBeInTheDocument();
    expect(screen.getByText('SSO Complete')).toBeInTheDocument();
  });

  it('falls back to IDs when no hierarchy provided', () => {
    renderCard({ hierarchy: undefined });
    expect(screen.getByText('rc1')).toBeInTheDocument();
  });

  it('shows Edit and Delete buttons in DRAFT status', () => {
    renderCard({ planStatus: 'DRAFT' });
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides Edit and Delete buttons in LOCKED status', () => {
    renderCard({ planStatus: 'LOCKED' });
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', () => {
    const onEdit = jest.fn();
    renderCard({ onEdit });
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(baseCommit);
  });

  it('calls onDelete when Delete button is clicked', () => {
    const onDelete = jest.fn();
    renderCard({ onDelete });
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('c1');
  });

  it('shows chess category badge when set', () => {
    renderCard({ commit: { ...baseCommit, chessCategory: 'KING' } });
    expect(screen.getByText('King')).toBeInTheDocument();
  });

  it('shows carried forward badge when carriedFromId is set', () => {
    renderCard({ commit: { ...baseCommit, carriedFromId: 'prev-c1' } });
    expect(screen.getByText('Carried forward')).toBeInTheDocument();
  });
});
