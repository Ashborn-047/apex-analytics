import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../config";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  "If Verstappen boxes on lap 18 in Monaco GP, does he clear the mid-field DRS train?",
  "Who is currently leading the driver Elo ratings standings?",
  "Recommend a tyre stint strategy for Leclerc starting on Mediums at Monza.",
  "What is the DNF probability for Hamilton in wet weather?",
];

const DRIVERS = [
  { code: "VER", name: "Max Verstappen (Red Bull)" },
  { code: "NOR", name: "Lando Norris (McLaren)" },
  { code: "LEC", name: "Charles Leclerc (Ferrari)" },
  { code: "SAI", name: "Carlos Sainz (Ferrari)" },
  { code: "HAM", name: "Lewis Hamilton (Mercedes)" },
  { code: "RUS", name: "George Russell (Mercedes)" },
  { code: "PIA", name: "Oscar Piastri (McLaren)" },
  { code: "ALO", name: "Fernando Alonso (Aston Martin)" },
];

export default function ApexBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "System initialized. I am APEX Bot, your elite F1 Race Strategy and Analytics Assistant. Ask me any analytical question, and I will compile telemetry, historical database schemas, and predictions to assist you.",
      timestamp: new Date(),
    },
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // RAG Context Parameters
  const [includeElo, setIncludeElo] = useState(false);
  const [includeStrategy, setIncludeStrategy] = useState(false);
  const [driverContext, setDriverContext] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/analysis/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: textToSend,
          include_elo: includeElo,
          include_strategy: includeStrategy,
          driver_id_context: driverContext || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMsg: Message = {
        sender: "bot",
        text: data.response || "No response received.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMsg: Message = {
        sender: "bot",
        text: `⚠️ Telemetry Feed Interrupted. Failed to communicate with ML assistant: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%", maxHeight: "calc(100vh - 4rem)" }}>
      {/* Title Block */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
          APEX Bot Strategist
        </h2>
        <p className="editorial" style={{ fontStyle: "italic", fontFamily: "var(--font-editorial)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Interact with our Agentic Query Router utilizing Text-to-SQL database memory, vector stores, and real-time prediction feeds.
        </p>
      </div>

      {/* Main Container splits into Chat Workspace and Configuration Panel */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", flex: 1, minHeight: 0 }}>
        
        {/* Left: Chat Workspace */}
        <div style={{
          flex: "1 1 500px",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-panel)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "4px",
          overflow: "hidden",
          minHeight: "450px"
        }}>
          {/* Active Terminal Header */}
          <div style={{
            background: "var(--bg-surface)",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="pulse-dot live" style={{ width: "8px", height: "8px" }} />
              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: "bold" }}>
                CONSOLE: APEX-BOT-SESSION
              </span>
            </div>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              NEMOTRON-70B // ACTIVE
            </span>
          </div>

          {/* Messages Panel */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            background: "var(--bg-input)"
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.25rem",
                  padding: "0 0.25rem"
                }}>
                  <span className="text-mono" style={{
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    color: msg.sender === "user" ? "var(--text-muted)" : "var(--accent-primary)"
                  }}>
                    {msg.sender === "user" ? "TACTICAL COMMAND" : "APEX RECOMMENDATION"}
                  </span>
                  <span className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-dim)" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div style={{
                  background: msg.sender === "user" ? "var(--bg-elevated)" : "var(--bg-panel)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: msg.sender === "bot" ? "3px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  borderRadius: "3px",
                  padding: "0.75rem 1rem",
                  color: "var(--text-primary)",
                  fontSize: "0.8rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  fontFamily: msg.sender === "bot" ? "var(--font-mono)" : "inherit"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{ alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)" }}>
                  PROCESSING APEX STRATEGY...
                </span>
                <div style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: "3px solid var(--accent-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <div className="pulse-dot live" style={{ background: "var(--accent-primary)" }} />
                  <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Synthesizing SQL telemetry, RAG chunks & prediction windows...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Queries Grid */}
          <div style={{
            background: "var(--bg-surface)",
            padding: "0.75rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              SUGGESTED ANALYTICAL INQUIRIES:
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.5rem" }}>
              {SUGGESTED_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-mono"
                  style={{
                    background: "var(--bg-void)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "2px",
                    padding: "0.4rem 0.6rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.65rem",
                    textAlign: "left",
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Controls */}
          <div style={{
            padding: "0.75rem",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "0.75rem"
          }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(query)}
              placeholder="Query F1 database, retrieve documents or request predictions..."
              style={{
                flex: 1,
                background: "var(--bg-void)",
                border: "1px solid var(--border-mid)",
                borderRadius: "2px",
                padding: "0.6rem 0.8rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem"
              }}
            />
            <button
              onClick={() => handleSend(query)}
              disabled={loading || !query.trim()}
              className="btn-primary"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: "bold",
                padding: "0 1.25rem",
                borderRadius: "2px",
                background: "var(--accent-primary)",
                color: "var(--bg-void)",
                border: "none",
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                opacity: loading || !query.trim() ? 0.5 : 1
              }}
            >
              SEND
            </button>
          </div>
        </div>

        {/* Right: Context & Injections Panel */}
        <div style={{
          flex: "0 1 260px",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          background: "var(--bg-panel)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "4px",
          padding: "1.25rem"
        }}>
          <div>
            <h4 className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: "0 0 0.5rem 0", letterSpacing: "0.05em" }}>
              TACTICAL CONTEXT SETUP
            </h4>
            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.4, margin: 0 }}>
              Adjust context variables injected into prompt templates to augment response accuracy.
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: 0 }} />

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* Elo injection checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeElo}
                onChange={(e) => setIncludeElo(e.target.checked)}
                style={{ marginTop: "0.15rem", accentColor: "var(--accent-primary)" }}
              />
              <div>
                <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", display: "block" }}>
                  Inject Live ELO Data
                </span>
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>
                  Appends current driver head-to-head standings to query context.
                </span>
              </div>
            </label>

            {/* Strategy injection checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeStrategy}
                onChange={(e) => setIncludeStrategy(e.target.checked)}
                style={{ marginTop: "0.15rem", accentColor: "var(--accent-primary)" }}
              />
              <div>
                <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", display: "block" }}>
                  Inject Live Strategy
                </span>
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>
                  Appends model pit stop window calculations for active driver context.
                </span>
              </div>
            </label>

            {/* Target Driver Context Selection */}
            <div>
              <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                TARGET DRIVER CONTEXT
              </span>
              <select
                value={driverContext}
                onChange={(e) => setDriverContext(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-void)",
                  border: "1px solid var(--border-mid)",
                  borderRadius: "2px",
                  padding: "0.4rem 0.5rem",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem"
                }}
              >
                <option value="">-- GENERAL SUMMARY --</option>
                {DRIVERS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} ({d.name.split(" ")[0]})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginTop: "0.3rem" }}>
                Target queries specifically to a selected driver's telemetry profile.
              </span>
            </div>

          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: 0 }} />

          {/* Active Model Badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              CONNECTED AGENT PLUGINS:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)", border: "1px solid var(--border-accent)", padding: "0.15rem 0.4rem", borderRadius: "2px", background: "var(--accent-tint)" }}>
                vector-store (pgvector)
              </span>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)", border: "1px solid var(--border-accent)", padding: "0.15rem 0.4rem", borderRadius: "2px", background: "var(--accent-tint)" }}>
                sql-db (Text-to-SQL)
              </span>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)", border: "1px solid var(--border-accent)", padding: "0.15rem 0.4rem", borderRadius: "2px", background: "var(--accent-tint)" }}>
                ml-predictions (Elo/Window)
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
