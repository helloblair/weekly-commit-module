import { chessTheme, completionTheme, planStatusTheme } from '../theme';

describe('chessTheme', () => {
  it('returns correct label for each category in light mode', () => {
    expect(chessTheme('KING', 'light').label).toBe('King');
    expect(chessTheme('QUEEN', 'light').label).toBe('Queen');
    expect(chessTheme('ROOK', 'light').label).toBe('Rook');
    expect(chessTheme('KNIGHT', 'light').label).toBe('Knight');
    expect(chessTheme('PAWN', 'light').label).toBe('Pawn');
  });

  it('returns different colors for light vs dark mode', () => {
    const light = chessTheme('KING', 'light');
    const dark = chessTheme('KING', 'dark');
    expect(light.color).not.toBe(dark.color);
    expect(light.bg).not.toBe(dark.bg);
  });

  it('returns fallback for unknown category', () => {
    const result = chessTheme('BISHOP', 'light');
    expect(result.label).toBe('BISHOP');
  });
});

describe('completionTheme', () => {
  it('returns correct labels', () => {
    expect(completionTheme('COMPLETED', 'light').label).toBe('Completed');
    expect(completionTheme('PARTIAL', 'light').label).toBe('Partial');
    expect(completionTheme('NOT_STARTED', 'light').label).toBe('Not Started');
    expect(completionTheme('BLOCKED', 'light').label).toBe('Blocked');
  });

  it('returns fallback for unknown status', () => {
    const result = completionTheme('UNKNOWN', 'dark');
    expect(result.label).toBe('UNKNOWN');
  });
});

describe('planStatusTheme', () => {
  it('returns distinct colors for each status', () => {
    const statuses = ['DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED'];
    const colors = statuses.map((s) => planStatusTheme(s, 'light').color);
    expect(new Set(colors).size).toBe(4);
  });
});
