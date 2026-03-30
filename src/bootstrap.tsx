import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import WeeklyCommitPage from "./pages/WeeklyCommitPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import { setAuthTokenProvider } from "./api/client";
import { ThemeProvider, ThemeToggle } from "./theme";

// Dev-mode fallbacks — used only when running standalone (no host app)
const DEV_DEFAULTS = {
  userId: "00000000-0000-0000-0000-000000000001",
  orgId: "00000000-0000-0000-0000-000000000010",
  managerId: "00000000-0000-0000-0000-000000000099",
};

// Props the host app passes when mounting this module via Module Federation
export interface WeeklyCommitModuleProps {
  userId?: string;
  orgId?: string;
  managerId?: string;
  tokenProvider?: () => string;
}

type View = "my-week" | "manager";

function App({ userId, orgId, managerId, tokenProvider }: WeeklyCommitModuleProps) {
  const resolvedUserId = userId ?? DEV_DEFAULTS.userId;
  const resolvedOrgId = orgId ?? DEV_DEFAULTS.orgId;
  const resolvedManagerId = managerId ?? DEV_DEFAULTS.managerId;

  useEffect(() => {
    if (tokenProvider) {
      setAuthTokenProvider(tokenProvider);
    }
  }, [tokenProvider]);

  const [view, setView] = useState<View>("my-week");

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-surface)",
        transition: "background-color 200ms ease, border-color 200ms ease",
      }}>
        <button
          type="button"
          onClick={() => { setView("my-week"); }}
          style={{
            padding: "7px 16px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: view === "my-week" ? "var(--primary)" : "transparent",
            color: view === "my-week" ? "var(--primary-text)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            transition: "all 150ms ease",
          }}
        >
          My Week
        </button>
        <button
          type="button"
          onClick={() => { setView("manager"); }}
          style={{
            padding: "7px 16px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: view === "manager" ? "var(--primary)" : "transparent",
            color: view === "manager" ? "var(--primary-text)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            transition: "all 150ms ease",
          }}
        >
          Team Dashboard
        </button>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle />
        </div>
      </nav>
      {view === "my-week" ? (
        <WeeklyCommitPage userId={resolvedUserId} orgId={resolvedOrgId} />
      ) : (
        <ManagerDashboard managerId={resolvedManagerId} orgId={resolvedOrgId} />
      )}
    </div>
  );
}

// Standalone mount — only runs when loaded directly (not via Module Federation)
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

// Module Federation exports — host app imports these individually
export { WeeklyCommitPage, ManagerDashboard };
export default App;
