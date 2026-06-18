import { useState } from "react";
import { exportAsCSV, exportAsJSON, exportAsPDF, generateTelemetryReport, formatForSharing, copyToClipboard, DriverReport, StrategyReport, ChampionshipReport } from "../lib/export";

interface ExportPanelProps {
  drivers: DriverReport[];
  strategies?: StrategyReport[];
  championship?: ChampionshipReport;
  title?: string;
}

export default function ExportPanel({ drivers, strategies = [], championship, title = "Telemetry Report" }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const report = generateTelemetryReport(drivers, strategies, championship);
      const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.${format}`;

      if (format === "csv") {
        exportAsCSV(report, filename);
        setExportStatus("✓ CSV exported successfully");
      } else if (format === "json") {
        exportAsJSON(report, filename);
        setExportStatus("✓ JSON exported successfully");
      } else if (format === "pdf") {
        await exportAsPDF(report, filename);
        setExportStatus("✓ PDF exported successfully (or CSV fallback)");
      }

      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("✗ Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      const report = generateTelemetryReport(drivers, strategies, championship);
      const shareText = formatForSharing(report);
      await copyToClipboard(shareText);
      setExportStatus("✓ Copied to clipboard");
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      console.error("Share failed:", error);
      setExportStatus("✗ Share failed");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {/* Export buttons */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent-primary)",
            color: "var(--bg-surface)",
            border: "none",
            borderRadius: "3px",
            cursor: isExporting ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            opacity: isExporting ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isExporting) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px var(--accent-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          CSV
        </button>

        <button
          onClick={() => handleExport("json")}
          disabled={isExporting}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent-primary)",
            color: "var(--bg-surface)",
            border: "none",
            borderRadius: "3px",
            cursor: isExporting ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            opacity: isExporting ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isExporting) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px var(--accent-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          JSON
        </button>

        <button
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent-primary)",
            color: "var(--bg-surface)",
            border: "none",
            borderRadius: "3px",
            cursor: isExporting ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            opacity: isExporting ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isExporting) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px var(--accent-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          PDF
        </button>

        <button
          onClick={handleShare}
          disabled={isExporting}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent-warning)",
            color: "var(--bg-surface)",
            border: "none",
            borderRadius: "3px",
            cursor: isExporting ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            opacity: isExporting ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isExporting) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(251,191,36,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          SHARE
        </button>
      </div>

      {/* Status indicator */}
      {exportStatus && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: exportStatus.includes("✓") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${exportStatus.includes("✓") ? "var(--accent-success)" : "var(--accent-danger)"}40`,
            borderRadius: "3px",
            color: exportStatus.includes("✓") ? "var(--accent-success)" : "var(--accent-danger)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {exportStatus}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

