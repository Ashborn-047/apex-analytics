import { useState, Component, ErrorInfo, ReactNode } from "react";
import EloDashboard from "./pages/EloDashboard";
import TyreLapPredictor from "./pages/TyreLapPredictor";
import PitWallPlanner from "./pages/PitWallPlanner";
import MonteCarlo from "./pages/MonteCarlo";
import DriverProfile from "./pages/DriverProfile";
import DriverCompare from "./pages/DriverCompare";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in page component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "2rem",
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid var(--accent-danger)",
          borderRadius: "4px",
          color: "var(--text-primary)",
          margin: "2rem 0",
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", color: "var(--accent-danger)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            ⚠️ TELEMETRY FEED INTERRUPTED
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            The ML model calculation or database connection for this page encountered an error.
          </p>
          <pre style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            background: "var(--bg-elevated)",
            padding: "1rem",
            borderRadius: "2px",
            overflowX: "auto",
            border: "1px solid var(--border-subtle)",
            color: "var(--accent-danger)",
            whiteSpace: "pre-wrap",
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "1rem",
              background: "var(--accent-primary)",
              color: "var(--bg-void)",
              border: "none",
              padding: "0.5rem 1rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              fontWeight: "bold",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            RECONNECT FEED
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type Tab = "elo" | "tyres" | "pit" | "montecarlo" | "driver-profile" | "compare";

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

function TopNav({
  active,
  onSelect,
  season,
  onSeasonChange,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
  season: number;
  onSeasonChange: (s: number) => void;
}) {
  const highlightedTab = (active === "driver-profile" || active === "compare") ? "elo" : active;
  return (
    <header style={{
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,212,255,0.1)",
    }}>
      {/* Top bar with enhanced telemetry styling */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 2rem",
        height: "48px",
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative",
      }}>
        {/* Telemetry top accent line */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, var(--accent-primary), transparent)",
          opacity: 0.4,
        }} />

        {/* Logo / wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "24px", height: "24px",
            background: "linear-gradient(135deg, var(--accent-primary), #0099b3)",
            borderRadius: "3px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(0,212,255,0.3)",
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

        {/* Meta info with enhanced styling */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="pulse-dot live" />
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 600 }}>
              LIVE · R12 / 24
            </span>
          </div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            OpenF1 + Jolpica
          </div>
          <div style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,212,255,0.05))",
            border: "1px solid var(--border-accent)",
            borderRadius: "2px",
            padding: "0.1rem 0.4rem",
            boxShadow: "0 0 8px rgba(0,212,255,0.1)",
            display: "flex",
            alignItems: "center",
          }}>
            <select
              value={season}
              onChange={(e) => onSeasonChange(Number(e.target.value))}
              className="text-mono"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-primary)",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                outline: "none",
                cursor: "pointer",
                paddingRight: "0.25rem",
                textTransform: "uppercase",
              }}
            >
              <option value={2026} style={{ background: "var(--bg-panel)", color: "var(--text-primary)" }}>2026 SEASON</option>
              <option value={2025} style={{ background: "var(--bg-panel)", color: "var(--text-primary)" }}>2025 SEASON</option>
              <option value={2024} style={{ background: "var(--bg-panel)", color: "var(--text-primary)" }}>2024 SEASON</option>
              <option value={2023} style={{ background: "var(--bg-panel)", color: "var(--text-primary)" }}>2023 SEASON</option>
              <option value={2022} style={{ background: "var(--bg-panel)", color: "var(--text-primary)" }}>2022 SEASON</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab nav with enhanced telemetry styling */}
      <div style={{ 
        display: "flex", 
        padding: "0 2rem", 
        gap: "0.25rem", 
        overflowX: "auto",
        position: "relative",
      }}>
        {/* Subtle grid background */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(90deg, transparent 24%, rgba(0,212,255,0.02) 25%, rgba(0,212,255,0.02) 26%, transparent 27%, transparent 74%, rgba(0,212,255,0.02) 75%, rgba(0,212,255,0.02) 76%, transparent 77%, transparent)",
          backgroundSize: "80px 100%",
          pointerEvents: "none",
        }} />

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0.625rem 1rem",
              background: highlightedTab === item.id ? "rgba(0,212,255,0.08)" : "transparent",
              border: "none",
              borderBottom: `2px solid ${highlightedTab === item.id ? "var(--accent-primary)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              gap: "0.1rem",
              minWidth: "fit-content",
              position: "relative",
              zIndex: 1,
            }}
            onMouseEnter={(e) => {
              if (highlightedTab !== item.id) {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (highlightedTab !== item.id) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.8rem", opacity: highlightedTab === item.id ? 1 : 0.5, transition: "opacity 0.2s" }}>{item.icon}</span>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem",
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: highlightedTab === item.id ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s",
              }}>
                {item.label}
              </span>
            </div>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: highlightedTab === item.id ? "var(--accent-primary)" : "var(--text-dim)", letterSpacing: "0.1em", transition: "color 0.2s" }}>
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
  const [selectedSeason, setSelectedSeason] = useState<number>(2026);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const PAGE_MAP: Record<Tab, JSX.Element> = {
    elo: (
      <EloDashboard
        season={selectedSeason}
        onViewProfile={(id) => {
          setSelectedDriverId(id);
          setActiveTab("driver-profile");
        }}
        onViewCompare={(id) => {
          setSelectedDriverId(id);
          setActiveTab("compare");
        }}
      />
    ),
    tyres:      <TyreLapPredictor season={selectedSeason} />,
    pit:        <PitWallPlanner season={selectedSeason} />,
    montecarlo: <MonteCarlo season={selectedSeason} />,
    "driver-profile": (
      <DriverProfile
        driverId={selectedDriverId || "VER"}
        onBack={() => setActiveTab("elo")}
        onCompare={(id) => {
          setSelectedDriverId(id);
          setActiveTab("compare");
        }}
      />
    ),
    compare: (
      <DriverCompare
        initialDriverId={selectedDriverId || "VER"}
        onBack={() => setActiveTab("elo")}
      />
    ),
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)" }}>
      <TopNav
        active={activeTab}
        onSelect={setActiveTab}
        season={selectedSeason}
        onSeasonChange={setSelectedSeason}
      />

      {/* Page content */}
      <main style={{ padding: "1.5rem 2rem", maxWidth: "1600px", margin: "0 auto" }} className="fade-up">
        <PageErrorBoundary key={activeTab}>
          {PAGE_MAP[activeTab]}
        </PageErrorBoundary>
      </main>

      {/* Footer with telemetry styling */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "0.875rem 2rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: "2rem",
        background: "linear-gradient(180deg, transparent, rgba(0,212,255,0.02))",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, var(--accent-primary), transparent)",
          opacity: 0.2,
        }} />
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
