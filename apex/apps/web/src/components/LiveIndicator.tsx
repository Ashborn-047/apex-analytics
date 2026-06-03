import { useWebSocket } from "../hooks/useWebSocket";

export default function LiveIndicator() {
  const { isConnected, lastMessage } = useWebSocket();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Pulsing dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: isConnected ? "var(--accent-success)" : "var(--accent-danger)",
          boxShadow: isConnected ? "0 0 8px var(--accent-success)" : "0 0 8px var(--accent-danger)",
          animation: isConnected ? "pulse-live 2s ease-in-out infinite" : "none",
        }}
      />

      {/* Status text */}
      <div className="text-mono" style={{ fontSize: "0.65rem", fontWeight: 600, color: isConnected ? "var(--accent-success)" : "var(--accent-danger)", letterSpacing: "0.08em" }}>
        {isConnected ? "LIVE" : "OFFLINE"}
      </div>

      {/* Update count */}
      {isConnected && lastMessage && (
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
          {lastMessage.type}
        </div>
      )}

      <style>{`
        @keyframes pulse-live {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 8px var(--accent-success);
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 12px var(--accent-success);
          }
        }
      `}</style>
    </div>
  );
}
