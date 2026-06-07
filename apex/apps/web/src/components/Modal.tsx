import { useState, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showBackButton?: boolean;
  onBack?: () => void;
}

const SIZE_CONFIG: Record<string, { maxWidth: string; maxHeight: string }> = {
  sm: { maxWidth: "480px", maxHeight: "70vh" },
  md: { maxWidth: "768px", maxHeight: "80vh" },
  lg: { maxWidth: "1024px", maxHeight: "85vh" },
  xl: { maxWidth: "95vw", maxHeight: "92vh" },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  showBackButton = false,
  onBack,
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.lg;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.3s ease-out",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Modal Centering Wrapper */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: isOpen ? "auto" : "none",
          padding: size === "xl" ? "1rem" : "2rem",
        }}
        onClick={onClose}
      >
        {/* Modal Card */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-active)",
            borderRadius: "6px",
            boxShadow: "0 0 40px var(--accent-dim), 0 25px 80px rgba(0, 0, 0, 0.6)",
            width: "100%",
            maxWidth: sizeConfig.maxWidth,
            maxHeight: sizeConfig.maxHeight,
            display: "flex",
            flexDirection: "column",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "scale(1)" : "scale(0.95)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
          className="modal-content"
        >
          {/* Header - Fixed at top */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
              background: "linear-gradient(180deg, var(--bg-surface), var(--bg-panel))",
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {showBackButton && (
                  <button
                    onClick={onBack || onClose}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-primary)",
                      cursor: "pointer",
                      fontSize: "1.5rem",
                      padding: "0.25rem 0.5rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    â†
                  </button>
                )}
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--accent-primary)",
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      className="text-mono"
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-muted)",
                        margin: "0.25rem 0 0 0",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "1.5rem",
                padding: "0.25rem 0.5rem",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--accent-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              âœ•
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            style={{
              padding: "1.5rem",
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }}
            className="modal-scroll-body"
          >
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .modal-content {
            animation: modalEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes modalEnter {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        }

        .modal-scroll-body::-webkit-scrollbar {
          width: 8px;
        }

        .modal-scroll-body::-webkit-scrollbar-track {
          background: var(--bg-panel);
        }

        .modal-scroll-body::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 4px;
        }

        .modal-scroll-body::-webkit-scrollbar-thumb:hover {
          background: var(--border-active);
        }
      `}</style>
    </>
  );
}

