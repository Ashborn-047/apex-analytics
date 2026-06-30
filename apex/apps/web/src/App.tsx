import { lazy, Suspense, useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Routes, Route, Navigate, NavLink, useParams, useNavigate } from "react-router-dom";
import { ChatProvider } from "./context/ChatContext";
import ChatDrawer from "./components/ChatDrawer";

// Lazy-load all page components so each route gets its own JS chunk
const EloDashboard    = lazy(() => import("./pages/EloDashboard"));
const TyreLapPredictor = lazy(() => import("./pages/TyreLapPredictor"));
const PitWallPlanner  = lazy(() => import("./pages/PitWallPlanner"));
const MonteCarlo      = lazy(() => import("./pages/MonteCarlo"));
const DriverProfile   = lazy(() => import("./pages/DriverProfile"));
const DriverCompare   = lazy(() => import("./pages/DriverCompare"));
const RacePreview     = lazy(() => import("./pages/RacePreview"));
const DocsWiki        = lazy(() => import("./pages/DocsWiki"));
const ApexBot         = lazy(() => import("./pages/ApexBot"));

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
          background: "rgba(192, 57, 43, 0.05)",
          border: "1px solid var(--status-danger)",
          borderRadius: "4px",
          color: "var(--text-primary)",
          margin: "2rem 0",
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", color: "var(--status-danger)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
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
            color: "var(--status-danger)",
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

type Tab = "elo" | "tyres" | "pit" | "montecarlo" | "driver-profile" | "compare" | "preview" | "docs" | "bot";

interface NavItem {
  id: Tab;
  label: string;
  sublabel: string;
  icon: ReactNode;
}

const LightningIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

const TireIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="5" />
  </svg>
);

const HexagonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
  </svg>
);

const BookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
  </svg>
);

const ChatIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const DocIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { id: "elo",         label: "Driver Elo",     sublabel: "H2H STANDINGS",     icon: <LightningIcon /> },
  { id: "preview",     label: "Race Preview",   sublabel: "GRID & OUTCOME",    icon: <GridIcon /> },
  { id: "tyres",       label: "Tyre & Lap",     sublabel: "DEGRADATION MODEL", icon: <TireIcon /> },
  { id: "pit",         label: "Pit Wall",        sublabel: "STRATEGY PLANNER",  icon: <HexagonIcon /> },
  { id: "montecarlo",  label: "Monte Carlo",    sublabel: "CHAMPIONSHIP SIM",  icon: <BookIcon /> },
  { id: "bot",         label: "APEX Bot",       sublabel: "AI STRATEGIST",     icon: <ChatIcon /> },
  { id: "docs",        label: "ML Wiki",        sublabel: "MODEL REFERENCE",   icon: <DocIcon /> },
];

const THEMES = {
  noir: {
    '--bg-void':'#0a0907','--bg-surface':'#141210','--bg-panel':'#1a1814','--bg-elevated':'#252220','--bg-input':'#111009',
    '--accent-primary':'#e8a020','--accent-bright':'#f4b840','--accent-dim':'#e8a02028','--accent-tint':'#e8a02012',
    '--status-danger':'#c0392b','--status-warning':'#b8860b','--status-success':'#5a8a3c',
    '--text-primary':'#f0ece4','--text-secondary':'#a09080','--text-muted':'#625850','--text-dim':'#3a3430',
    '--border-ghost':'#1e1c18','--border-subtle':'#2a2620','--border-mid':'#3c3830','--border-accent':'#e8a02030',
  },
  petro: {
    '--bg-void':'#020507','--bg-surface':'#0c1219','--bg-panel':'#111a24','--bg-elevated':'#182536','--bg-input':'#070b10',
    '--accent-primary':'#00c8f0','--accent-bright':'#00e0ff','--accent-dim':'#00c8f028','--accent-tint':'#00c8f012',
    '--status-danger':'#e84040','--status-warning':'#f0b429','--status-success':'#1db954',
    '--text-primary':'#ddeaf6','--text-secondary':'#7a9ab8','--text-muted':'#3d5a72','--text-dim':'#1e3244',
    '--border-ghost':'#141e28','--border-subtle':'#1c2e40','--border-mid':'#26415a','--border-accent':'#00c8f030',
  },
  redline: {
    '--bg-void':'#030304','--bg-surface':'#0e0e10','--bg-panel':'#141416','--bg-elevated':'#1c1c20','--bg-input':'#080809',
    '--accent-primary':'#e8192e','--accent-bright':'#ff3348','--accent-dim':'#e8192e28','--accent-tint':'#e8192e12',
    '--status-danger':'#ff3348','--status-warning':'#f5c518','--status-success':'#00d95a',
    '--text-primary':'#f2f2f4','--text-secondary':'#8e8e99','--text-muted':'#505058','--text-dim':'#2c2c32',
    '--border-ghost':'#18181c','--border-subtle':'#1e1e22','--border-mid':'#2e2e36','--border-accent':'#e8192e28',
  },
  rolex: {
    '--bg-void':'#020510','--bg-surface':'#0a1230','--bg-panel':'#0f1a42','--bg-elevated':'#162254','--bg-input':'#060c1e',
    '--accent-primary':'#c9a830','--accent-bright':'#dfc050','--accent-dim':'#c9a83028','--accent-tint':'#c9a83012',
    '--status-danger':'#e84040','--status-warning':'#e88c10','--status-success':'#22c55e',
    '--text-primary':'#eef1f8','--text-secondary':'#7a91b8','--text-muted':'#3d5278','--text-dim':'#1d2e4c',
    '--border-ghost':'#121a34','--border-subtle':'#182038','--border-mid':'#243050','--border-accent':'#c9a83028',
  }
};

function DriverProfileWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <DriverProfile
      driverId={id || "VER"}
      onBack={() => navigate("/elo")}
      onCompare={(compareId) => navigate(`/elo/compare?driver=${compareId}`)}
    />
  );
}

function DriverCompareWrapper() {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const driverId = query.get("driver") || "VER";
  return (
    <DriverCompare
      initialDriverId={driverId}
      onBack={() => navigate("/elo")}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState<number>(2026);
  const [currentTheme, setCurrentTheme] = useState<"noir" | "petro" | "redline" | "rolex">("noir");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Apply CSS custom properties dynamically on root when theme changes
  useEffect(() => {
    const themeProps = THEMES[currentTheme];
    const root = document.documentElement;
    Object.entries(themeProps).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
  }, [currentTheme]);

  return (
    <ChatProvider>
      <div className="app-viewport">
        {/* Mobile drawer trigger */}
      <button 
        className="mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Navigation Sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Drawer scrim overlay for mobile view */}
      <div 
        className={`drawer-scrim ${isSidebarOpen ? "is-visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ─── MASTER SIDEBAR (Left Column Navigation & Control) ─── */}
      <aside className={`master-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <div>
          {/* Logo Wordmark */}
          <div className="brand-section">
            {/* Inline Compact SVG Brand Logo */}
            <svg className="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="3" fill="var(--accent-primary)"/>
              <line x1="6" y1="25" x2="16" y2="7" stroke="var(--bg-void)" strokeWidth="2.5" strokeLinecap="square"/>
              <line x1="16" y1="7" x2="26" y2="25" stroke="var(--bg-void)" strokeWidth="2.5" strokeLinecap="square"/>
              <line x1="9" y1="20" x2="23" y2="20" stroke="var(--bg-void)" strokeWidth="1.75" strokeLinecap="square"/>
              <rect x="14.5" y="5.5" width="3" height="3" fill="var(--bg-void)"/>
            </svg>
            <div>
              <span className="brand-label">Race Intelligence</span>
              <span className="brand-version">CONSOLE v0.1.0 (v3.0)</span>
            </div>
          </div>

          {/* Live Telemetry Ping */}
          <div className="live-badge">
            <div className="pulse-dot live" />
            <span className="live-text">LIVE · BELGIAN GP · SPA</span>
          </div>

          {/* Season Selector */}
          <div className="selector-block">
            <span className="selector-label">Active Season</span>
            <select 
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(Number(e.target.value))} 
              className="selector-dropdown"
            >
              <option value={2026}>2026 SEASON</option>
              <option value={2025}>2025 SEASON</option>
              <option value={2024}>2024 SEASON</option>
              <option value={2023}>2023 SEASON</option>
              <option value={2022}>2022 SEASON</option>
            </select>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const toPath = item.id === "pit" ? "/pitstop" : item.id === "docs" ? "/docs" : `/${item.id}`;
              return (
                <NavLink
                  key={item.id}
                  to={toPath}
                  role="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-text">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-sublabel">{item.sublabel}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="sidebar-footer">
          <span className="footer-meta">OPENF1 + JOLPICA SECURED</span>
          <span className="footer-meta">ML ENGINE: Ridge · XGBoost · Elo</span>
          
          {/* Skin Selector Grid */}
          <span className="theme-switcher-label">System Skin</span>
          <div className="theme-grid">
            <button 
              className={`theme-btn ${currentTheme === "noir" ? "active" : ""}`}
              onClick={() => setCurrentTheme("noir")}
            >
              DATA NOIR
            </button>
            <button 
              className={`theme-btn ${currentTheme === "petro" ? "active" : ""}`}
              onClick={() => setCurrentTheme("petro")}
            >
              PETRONAS
            </button>
            <button 
              className={`theme-btn ${currentTheme === "redline" ? "active" : ""}`}
              onClick={() => setCurrentTheme("redline")}
            >
              REDLINE
            </button>
            <button 
              className={`theme-btn ${currentTheme === "rolex" ? "active" : ""}`}
              onClick={() => setCurrentTheme("rolex")}
            >
              ROLEX GOLD
            </button>
          </div>
        </div>
      </aside>

      {/* ─── DETAIL VIEWPORT (Right Column) ─── */}
      <main className="detail-viewport">
        <div className="detail-content">
          <PageErrorBoundary>
            <Suspense fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
                LOADING MODULE...
              </div>
            }>
            <Routes>
              <Route path="/" element={<Navigate to="/elo" replace />} />
              
              {/* Elo Rankings Module */}
              <Route 
                path="/elo" 
                element={
                  <EloDashboard 
                    season={selectedSeason} 
                    subTab="standings" 
                    onViewProfile={(id) => navigate(`/elo/driver/${id}`)}
                    onViewCompare={(id) => navigate(`/elo/compare?driver=${id}`)}
                  />
                } 
              />
              <Route 
                path="/elo/history" 
                element={
                  <EloDashboard 
                    season={selectedSeason} 
                    subTab="history" 
                    onViewProfile={(id) => navigate(`/elo/driver/${id}`)}
                    onViewCompare={(id) => navigate(`/elo/compare?driver=${id}`)}
                  />
                } 
              />
              <Route path="/elo/driver/:id" element={<DriverProfileWrapper />} />
              <Route path="/elo/compare" element={<DriverCompareWrapper />} />

              {/* Race Preview */}
              <Route path="/preview" element={<RacePreview season={selectedSeason} />} />

              {/* Tyre Degradation Module */}
              <Route path="/tyres" element={<TyreLapPredictor season={selectedSeason} subTab="predictor" />} />
              <Route path="/tyres/circuits" element={<TyreLapPredictor season={selectedSeason} subTab="circuits" />} />
              <Route path="/tyres/accuracy" element={<TyreLapPredictor season={selectedSeason} subTab="accuracy" />} />

              {/* Pit Wall Module */}
              <Route path="/pitstop" element={<PitWallPlanner season={selectedSeason} subTab="builder" />} />
              <Route path="/pitstop/live" element={<PitWallPlanner season={selectedSeason} subTab="live" />} />
              <Route path="/pitstop/history" element={<PitWallPlanner season={selectedSeason} subTab="history" />} />

              {/* Monte Carlo Module */}
              <Route path="/montecarlo" element={<MonteCarlo season={selectedSeason} subTab="forecast" />} />
              <Route path="/montecarlo/scenarios" element={<MonteCarlo season={selectedSeason} subTab="scenarios" />} />
              <Route path="/montecarlo/accuracy" element={<MonteCarlo season={selectedSeason} subTab="accuracy" />} />

              {/* APEX Bot Chat Assistant */}
              <Route path="/bot" element={<ApexBot />} />

              {/* ML Wiki Module */}
              <Route path="/docs" element={<DocsWiki subTab="concept" />} />
              <Route path="/docs/math" element={<DocsWiki subTab="logic" />} />
              <Route path="/docs/sources" element={<DocsWiki subTab="features" />} />
              <Route path="/docs/sandbox" element={<DocsWiki subTab="sandbox" />} />
              <Route path="/docs/changelog" element={<DocsWiki subTab="changelog" />} />
            </Routes>
            </Suspense>
          </PageErrorBoundary>
        </div>
      </main>
      
      {/* Global Sliding Chat Drawer (only conditionally handles its own visibility, but always mounted) */}
      <ChatDrawer />
    </div>
    </ChatProvider>
  );
}
