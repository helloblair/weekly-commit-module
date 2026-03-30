import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

// ---- CSS custom property tokens ----

const lightTokens: Record<string, string> = {
  '--bg': '#f4f5f7',
  '--bg-surface': '#ffffff',
  '--bg-raised': '#ffffff',
  '--bg-inset': '#eef0f4',
  '--text': '#1a1c23',
  '--text-secondary': '#4a4d5a',
  '--text-muted': '#8a8d9b',
  '--border': '#dfe1e6',
  '--border-subtle': '#eceef2',
  '--primary': '#2563eb',
  '--primary-hover': '#1d4ed8',
  '--primary-muted': '#93c5fd',
  '--primary-bg': '#eff6ff',
  '--primary-text': '#ffffff',
  '--error': '#dc2626',
  '--error-bg': '#fef2f2',
  '--error-border': '#fecaca',
  '--error-text': '#991b1b',
  '--success': '#16a34a',
  '--success-bg': '#f0fdf4',
  '--warning': '#d97706',
  '--warning-bg': '#fffbeb',
  '--warning-text': '#92400e',
  '--input-bg': '#ffffff',
  '--input-border': '#d1d5db',
  '--input-focus': '#2563eb',
  '--input-disabled-bg': '#f3f4f6',
  '--input-disabled-text': '#9ca3af',
  '--overlay-bg': 'rgba(0, 0, 0, 0.4)',
  '--shadow': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  '--shadow-md': '0 4px 12px rgba(0,0,0,0.08)',
  '--shadow-lg': '0 8px 24px rgba(0,0,0,0.12)',
};

const darkTokens: Record<string, string> = {
  '--bg': '#0e1015',
  '--bg-surface': '#181a21',
  '--bg-raised': '#1f2129',
  '--bg-inset': '#12141a',
  '--text': '#e2e4ea',
  '--text-secondary': '#9b9eb0',
  '--text-muted': '#636578',
  '--border': '#2a2d3a',
  '--border-subtle': '#1f2130',
  '--primary': '#3b82f6',
  '--primary-hover': '#60a5fa',
  '--primary-muted': '#1e3a5f',
  '--primary-bg': '#172554',
  '--primary-text': '#ffffff',
  '--error': '#ef4444',
  '--error-bg': '#2d0f0f',
  '--error-border': '#7f1d1d',
  '--error-text': '#fca5a5',
  '--success': '#22c55e',
  '--success-bg': '#0a1f0f',
  '--warning': '#f59e0b',
  '--warning-bg': '#261505',
  '--warning-text': '#fde68a',
  '--input-bg': '#1a1c24',
  '--input-border': '#333648',
  '--input-focus': '#3b82f6',
  '--input-disabled-bg': '#1f2028',
  '--input-disabled-text': '#4a4d5a',
  '--overlay-bg': 'rgba(0, 0, 0, 0.65)',
  '--shadow': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  '--shadow-md': '0 4px 12px rgba(0,0,0,0.3)',
  '--shadow-lg': '0 8px 24px rgba(0,0,0,0.45)',
};

// ---- Domain color helpers ----

interface ChessColors {
  label: string;
  color: string;
  bg: string;
  tint: string;
}

const CHESS: Record<ThemeMode, Record<string, ChessColors>> = {
  light: {
    KING:   { label: 'King',   color: '#b91c1c', bg: '#fee2e2', tint: '#fef2f2' },
    QUEEN:  { label: 'Queen',  color: '#7c3aed', bg: '#ede9fe', tint: '#f5f3ff' },
    ROOK:   { label: 'Rook',   color: '#1d4ed8', bg: '#dbeafe', tint: '#eff6ff' },
    KNIGHT: { label: 'Knight', color: '#15803d', bg: '#dcfce7', tint: '#f0fdf4' },
    PAWN:   { label: 'Pawn',   color: '#57534e', bg: '#f5f5f4', tint: '#fafaf9' },
  },
  dark: {
    KING:   { label: 'King',   color: '#fca5a5', bg: '#3b1111', tint: '#251012' },
    QUEEN:  { label: 'Queen',  color: '#c4b5fd', bg: '#2e1a47', tint: '#1e1330' },
    ROOK:   { label: 'Rook',   color: '#93c5fd', bg: '#0c2340', tint: '#0f1830' },
    KNIGHT: { label: 'Knight', color: '#86efac', bg: '#0a2914', tint: '#0e1a12' },
    PAWN:   { label: 'Pawn',   color: '#a8a29e', bg: '#292524', tint: '#201e1d' },
  },
};

export function chessTheme(category: string, mode: ThemeMode): ChessColors {
  return CHESS[mode][category] ?? { label: category, color: '#888', bg: '#f5f5f5', tint: '#fafafa' };
}

interface CompletionMeta {
  label: string;
  color: string;
  bg: string;
}

const COMPLETION: Record<ThemeMode, Record<string, CompletionMeta>> = {
  light: {
    COMPLETED:   { label: 'Completed',   color: '#15803d', bg: '#dcfce7' },
    PARTIAL:     { label: 'Partial',     color: '#c2410c', bg: '#fff7ed' },
    NOT_STARTED: { label: 'Not Started', color: '#4b5563', bg: '#f3f4f6' },
    BLOCKED:     { label: 'Blocked',     color: '#b91c1c', bg: '#fee2e2' },
  },
  dark: {
    COMPLETED:   { label: 'Completed',   color: '#4ade80', bg: '#0a2914' },
    PARTIAL:     { label: 'Partial',     color: '#fbbf24', bg: '#2e1a05' },
    NOT_STARTED: { label: 'Not Started', color: '#9ca3af', bg: '#1f2028' },
    BLOCKED:     { label: 'Blocked',     color: '#f87171', bg: '#3b1111' },
  },
};

export function completionTheme(status: string, mode: ThemeMode): CompletionMeta {
  return COMPLETION[mode][status] ?? { label: status, color: '#888', bg: '#f5f5f5' };
}

const PLAN_STATUS: Record<ThemeMode, Record<string, { color: string; bg: string }>> = {
  light: {
    DRAFT:       { color: '#6b7280', bg: '#f3f4f6' },
    LOCKED:      { color: '#1d4ed8', bg: '#dbeafe' },
    RECONCILING: { color: '#c2410c', bg: '#fef3c7' },
    RECONCILED:  { color: '#15803d', bg: '#dcfce7' },
  },
  dark: {
    DRAFT:       { color: '#9ca3af', bg: '#1f2028' },
    LOCKED:      { color: '#60a5fa', bg: '#172554' },
    RECONCILING: { color: '#fbbf24', bg: '#2e1a05' },
    RECONCILED:  { color: '#4ade80', bg: '#0a2914' },
  },
};

export function planStatusTheme(status: string, mode: ThemeMode): { color: string; bg: string } {
  return PLAN_STATUS[mode][status] ?? { color: '#888', bg: '#f5f5f5' };
}

// ---- Apply tokens to document root ----

function applyTokens(tokens: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}

const STORAGE_KEY = 'wcm-theme';

function getSystemMode(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getInitialMode(): ThemeMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return getSystemMode();
}

// Set tokens synchronously before first render to prevent flash
if (typeof document !== 'undefined') {
  applyTokens(getInitialMode() === 'dark' ? darkTokens : lightTokens);
}

// ---- Context ----

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => { /* default noop */ },
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  // Follow system preference when no stored preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => { mq.removeEventListener('change', handler); };
  }, []);

  // Apply tokens when mode changes
  useEffect(() => {
    applyTokens(mode === 'dark' ? darkTokens : lightTokens);
  }, [mode]);

  // Enable body transition after mount (avoids flash on initial load)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.style.transition = 'background-color 200ms ease, color 200ms ease';
    });
    return () => { cancelAnimationFrame(id); };
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-surface)',
        cursor: 'pointer',
        fontSize: '16px',
        lineHeight: 1,
        color: 'var(--text-secondary)',
        transition: 'all 150ms ease',
      }}
    >
      {mode === 'light' ? '☾' : '☀'}
    </button>
  );
}
