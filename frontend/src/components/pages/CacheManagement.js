import { useState, useEffect } from "react";
import { Trash2, Database, RefreshCw, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { OsintCard, StatCard, LoadingOverlay, OsintButton } from "@/components/shared/OsintUI";

export default function CacheManagement() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.getCacheStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load cache stats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async (action) => {
    setClearing(action);
    setMessage(null);
    try {
      const res = await api.clearCache(action);
      setMessage({ type: "success", text: res.data.message });
      await loadStats();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to clear cache" });
    } finally {
      setClearing(null);
    }
  };

  if (loading) {
    return <OsintCard><LoadingOverlay message="LOADING CACHE DATA..." /></OsintCard>;
  }

  return (
    <div className="animate-fade-in" data-testid="cache-page">
      <OsintCard title="Cache Management" icon={Database} testId="cache-management-card">
        <p style={{
          fontSize: "0.7rem", color: "#525252",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 24, letterSpacing: "0.05em",
        }}>
          Manage cached API responses. Cache reduces API calls and improves response times.
        </p>

        {message && (
          <div style={{
            background: message.type === "success" ? "rgba(0,255,148,0.08)" : "rgba(255,0,85,0.08)",
            border: `1px solid ${message.type === "success" ? "rgba(0,255,148,0.2)" : "rgba(255,0,85,0.2)"}`,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            color: message.type === "success" ? "#00FF94" : "#FF0055",
          }} data-testid="cache-message">
            {message.text}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}>
          <StatCard label="Hit Rate" value={`${(stats?.hit_rate || 0).toFixed(1)}%`} accent="#00FF94" testId="cache-hit-rate" />
          <StatCard label="Memory Entries" value={stats?.memory_entries || 0} accent="#00F0FF" testId="cache-memory" />
          <StatCard label="Disk Entries" value={stats?.disk_entries || 0} accent="#7000FF" testId="cache-disk" />
          <StatCard label="Cache Hits" value={stats?.hits || 0} accent="#FFD600" testId="cache-hits" />
          <StatCard label="Cache Misses" value={stats?.misses || 0} accent="#FF0055" testId="cache-misses" />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <OsintButton
            variant="ghost"
            onClick={() => handleClear("clear_expired")}
            loading={clearing === "clear_expired"}
            data-testid="clear-expired-button"
          >
            <RefreshCw size={14} />
            CLEAR EXPIRED
          </OsintButton>
          <OsintButton
            variant="danger"
            onClick={() => {
              if (window.confirm("Clear ALL cache entries? This cannot be undone.")) {
                handleClear("clear_all");
              }
            }}
            loading={clearing === "clear_all"}
            data-testid="clear-all-button"
          >
            <Trash2 size={14} />
            CLEAR ALL CACHE
          </OsintButton>
        </div>
      </OsintCard>

      {/* Info */}
      <div style={{ marginTop: 16 }}>
        <OsintCard title="Cache Information" icon={AlertTriangle} accent="#FFD600" testId="cache-info">
          <div style={{
            fontSize: "0.7rem", color: "#A0A0A0",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.8,
          }}>
            <p>Cache stores API responses to reduce external calls and improve performance.</p>
            <p style={{ marginTop: 8 }}>
              <span style={{ color: "#525252" }}>TTL:</span>{" "}
              <span style={{ color: "#00F0FF" }}>3600s (1 hour)</span>{" "}
              <span style={{ color: "#525252" }}>|</span>{" "}
              <span style={{ color: "#525252" }}>Compression:</span>{" "}
              <span style={{ color: "#00FF94" }}>ENABLED</span>{" "}
              <span style={{ color: "#525252" }}>|</span>{" "}
              <span style={{ color: "#525252" }}>Storage:</span>{" "}
              <span style={{ color: "#7000FF" }}>MEMORY + DISK</span>
            </p>
          </div>
        </OsintCard>
      </div>
    </div>
  );
}
