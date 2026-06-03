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

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
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

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.3s ease-out",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: isOpen ? "auto" : "none",
          padding: "1rem",
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-active)",
            borderRadius: "4px",
            boxShadow: "0 0 32px rgba(0, 212, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)",
            maxHeight: "90vh",
            overflow: "auto",
            width: "100%",
            maxWidth: "100%",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "scale(1)" : "scale(0.95)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
          className="modal-content"
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
              background: "linear-gradient(180deg, var(--bg-surface), var(--bg-panel))",
              position: "sticky",
              top: 0,
              zIndex: 10,
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
                    ←
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
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--accent-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: "1.5rem",
              maxWidth: SIZES[size as keyof typeof SIZES],
            }}
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

        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: var(--bg-panel);
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: var(--border-active);
        }
      `}</style>
    </>
  );
}
