import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import WeeklyCommitPage from "./pages/WeeklyCommitPage";
import ManagerDashboard from "./pages/ManagerDashboard";

// Stub IDs — will be replaced with real auth context from host app in Phase 6
const STUB_USER_ID = "00000000-0000-0000-0000-000000000001";
const STUB_ORG_ID = "00000000-0000-0000-0000-000000000010";
const STUB_MANAGER_ID = "00000000-0000-0000-0000-000000000099";

type View = "my-week" | "manager";

function App() {
  const [view, setView] = useState<View>("my-week");

  return (
    <div>
      <nav style={{ display: "flex", gap: "8px", padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
        <button
          type="button"
          onClick={() => { setView("my-week"); }}
          style={{
            padding: "6px 14px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: view === "my-week" ? "#1976d2" : "#fff",
            color: view === "my-week" ? "#fff" : "#333",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          My Week
        </button>
        <button
          type="button"
          onClick={() => { setView("manager"); }}
          style={{
            padding: "6px 14px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: view === "manager" ? "#1976d2" : "#fff",
            color: view === "manager" ? "#fff" : "#333",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Team Dashboard
        </button>
      </nav>
      {view === "my-week" ? (
        <WeeklyCommitPage userId={STUB_USER_ID} orgId={STUB_ORG_ID} />
      ) : (
        <ManagerDashboard managerId={STUB_MANAGER_ID} orgId={STUB_ORG_ID} />
      )}
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Module Federation exports — host app imports these individually
export { WeeklyCommitPage, ManagerDashboard };
export default WeeklyCommitPage;
