import { useState } from "react";
import EloDashboard from "./pages/EloDashboard";
import TyreLapPredictor from "./pages/TyreLapPredictor";
import PitWallPlanner from "./pages/PitWallPlanner";
import MonteCarlo from "./pages/MonteCarlo";

type Tab = "elo" | "tyres" | "pit" | "montecarlo";

interface NavItem {
  id: Tab;
  label: string;
  sublabel: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "elo",         label: "Driver Elo",     sublabel: "H2H RATINGS",      icon: "⚡" },
  { id: "tyres",       label: "Tyre & Lap",     sublabel: "DEGRADATION MODEL", icon: "◎" },
  { id: "pit",         label: "Pit Wall",        sublabel: "STRATEGY PLANNER",  icon: "⬡" },
  { id: "montecarlo",  label: "Monte Carlo",    sublabel: "CHAMPIONSHIP SIM",  icon: "∑" },
];

function TopNav({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <header style={{
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 2rem",
        height: "48px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        {/* Logo / wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "24px", height: "24px",
            background: "linear-gradient(135deg, var(--accent-primary), #0099b3)",
            borderRadius: "3px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--bg-void)", fontFamily: "var(--font-display)" }}>F1</span>
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
              Race Intelligence
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "0.75rem", letterSpacing: "0.08em" }}>
              v0.1.0
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="pulse-dot" />
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>
              LIVE · R12 / 24
            </span>
          </div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            OpenF1 + Jolpica
          </div>
          <div style={{
            background: "var(--accent-glow)",
            border: "1px solid var(--border-accent)",
            borderRadius: "2px",
            padding: "0.2rem 0.6rem",
          }}>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>
              2025 SEASON
            </span>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", padding: "0 2rem", gap: "0.25rem", overflowX: "auto" }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0.625rem 1rem",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${active === item.id ? "var(--accent-primary)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.15s",
              gap: "0.1rem",
              minWidth: "fit-content",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.8rem", opacity: active === item.id ? 1 : 0.5 }}>{item.icon}</span>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem",
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: active === item.id ? "var(--accent-primary)" : "var(--text-secondary)",
              }}>
                {item.label}
              </span>
            </div>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
              {item.sublabel}
            </span>
          </button>
        ))}
      </div>
    </header>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("elo");

  const PAGE_MAP: Record<Tab, JSX.Element> = {
    elo:        <EloDashboard />,
    tyres:      <TyreLapPredictor />,
    pit:        <PitWallPlanner />,
    montecarlo: <MonteCarlo />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)" }}>
      <TopNav active={activeTab} onSelect={setActiveTab} />

      {/* Page content */}
      <main style={{ padding: "1.5rem 2rem", maxWidth: "1600px", margin: "0 auto" }} className="fade-up">
        {PAGE_MAP[activeTab]}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "0.875rem 2rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: "2rem",
      }}>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          F1 ANALYTICS PLATFORM · TELEMETRY POWERED BY OPENF1 & ERGAST/JOLPICA
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
          ML PIPELINE: Ridge · XGBoost · Elo · Monte Carlo
        </div>
      </footer>
    </div>
  );
}
