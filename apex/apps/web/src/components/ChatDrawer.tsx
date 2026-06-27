import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { API_BASE } from "../config";
import { useLocation } from "react-router-dom";

export default function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { messages, addMessage, loading, setLoading, clearChat } = useChat();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    addMessage({
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    });

    setQuery("");
    setLoading(true);

    try {
      // Pass the current route as context
      const pageContext = `The user is currently on the route: ${location.pathname}`;

      const res = await fetch(`${API_BASE}/api/analysis/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          page_context: pageContext,
        }),
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      addMessage({
        sender: "bot",
        text: data.response,
        timestamp: new Date(),
      });
    } catch (err) {
      addMessage({
        sender: "bot",
        text: "[SYSTEM FAULT] Connection to ML inference engine lost.",
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Hide drawer completely on the dedicated /bot page
  if (location.pathname === '/bot') return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "var(--accent-primary)",
          color: "var(--bg-void)",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          cursor: "pointer",
          zIndex: 9999,
          border: "none"
        }}
        title="Open APEX AI"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "400px",
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.5)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 0.3s ease-out forwards"
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-panel)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="pulse-dot live" style={{ background: "var(--accent-primary)" }} />
              <span className="text-mono" style={{ fontWeight: "bold", color: "var(--text-primary)" }}>APEX STRATEGIST</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* Clear Chat Button */}
              <button
                onClick={clearChat}
                title="Clear Chat History"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              {/* Close Drawer Button */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close Drawer"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0.25rem"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            background: "var(--bg-input)"
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                  padding: "0 0.25rem"
                }}>
                  <span className="text-mono" style={{ fontSize: "0.55rem", fontWeight: "bold", color: msg.sender === "user" ? "var(--text-muted)" : "var(--accent-primary)" }}>
                    {msg.sender === "user" ? "YOU" : "APEX"}
                  </span>
                </div>
                <div style={{
                  background: msg.sender === "user" ? "var(--bg-elevated)" : "var(--bg-panel)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: msg.sender === "bot" ? "3px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  borderRadius: "3px",
                  padding: "0.75rem",
                  color: "var(--text-primary)",
                  fontSize: "0.75rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  fontFamily: msg.sender === "bot" ? "var(--font-mono)" : "inherit"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: "flex-start" }}>
                 <div style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: "3px solid var(--accent-primary)",
                  padding: "0.5rem",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <div className="pulse-dot live" style={{ background: "var(--accent-primary)" }} />
                  <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                    PROCESSING...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "1rem",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(query); }} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask APEX Strategist..."
                style={{
                  flex: 1,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  padding: "0.75rem",
                  borderRadius: "3px",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: "0.85rem"
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  background: "var(--accent-tint)",
                  border: "1px solid var(--accent-primary)",
                  color: "var(--accent-primary)",
                  padding: "0 1rem",
                  borderRadius: "3px",
                  cursor: (loading || !query.trim()) ? "not-allowed" : "pointer",
                  fontWeight: "bold"
                }}
              >
                &gt;
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
