import { useState, useEffect } from "react";
import { BarChart3, Radio, Activity, Clock, Zap, Database } from "lucide-react";
import api from "@/lib/api";
import { OsintCard, StatCard, ProgressBar, LoadingOverlay, EmptyState, Badge } from "@/components/shared/OsintUI";

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes] = await Promise.all([
        api.getStats(),
        api.getRecentAnalyses(),
      ]);
      setStats(statsRes.data);
      setRecent(recentRes.data.analyses || []);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <OsintCard><LoadingOverlay message="LOADING STATISTICS..." /></OsintCard>
    );
  }

  if (!stats) {
    return <OsintCard><EmptyState icon={BarChart3} message="Failed to load statistics." /></OsintCard>;
  }

  const db = stats.database || {};
  const cacheStats = stats.api?.cache || {};

  return (
    <div className="animate-fade-in" data-testid="statistics-page">
      {/* Main Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}>
        <StatCard label="Total Towers" value={(db.total_towers || 0).toLocaleString()} extra="Active in database" accent="#00FF94" testId="stat-total-towers" />
        <StatCard label="Unique Carriers" value={(db.unique_carriers || 0).toLocaleString()} extra="Mobile carriers" accent="#00F0FF" testId="stat-carriers" />
        <StatCard label="Countries" value={(db.unique_countries || 0).toLocaleString()} extra="Based on MCC codes" accent="#7000FF" testId="stat-countries" />
        <StatCard label="High Confidence" value={(db.high_confidence_towers || 0).toLocaleString()} extra="Confidence >= 70%" accent="#FFD600" testId="stat-high-conf" />
        <StatCard label="Total Analyses" value={(db.total_analyses || 0).toLocaleString()} extra={`${db.recent_analyses || 0} in last 24h`} accent="#FF0055" testId="stat-analyses" />
        <StatCard label="API Calls Today" value={(db.api_usage_today || 0).toLocaleString()} extra="External requests" accent="#00F0FF" testId="stat-api-calls" />
      </div>

      {/* Confidence Bar */}
      <div style={{ marginTop: 24 }}>
        <OsintCard title="Average Data Confidence" icon={Activity} testId="confidence-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{
              fontSize: "2rem", fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif",
              color: "#E0E0E0",
            }}>
              {((db.avg_confidence || 0) * 100).toFixed(1)}%
            </span>
            <span style={{
              fontSize: "0.65rem", color: "#525252",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Based on {(db.total_towers || 0).toLocaleString()} towers
            </span>
          </div>
          <ProgressBar value={(db.avg_confidence || 0) * 100} />
        </OsintCard>
      </div>

      {/* Radio Type & Top Carriers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
        {/* Radio Types */}
        {db.radio_breakdown && Object.keys(db.radio_breakdown).length > 0 && (
          <OsintCard title="Radio Types" icon={Radio} accent="#00F0FF" testId="radio-breakdown">
            {Object.entries(db.radio_breakdown).map(([type, count]) => (
              <div key={type} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #111",
              }}>
                <Badge variant={type === "5G" ? "success" : type === "LTE" ? "info" : "default"}>{type}</Badge>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem", color: "#E0E0E0",
                }}>
                  {count}
                </span>
              </div>
            ))}
          </OsintCard>
        )}

        {/* Top Carriers */}
        {db.top_carriers && db.top_carriers.length > 0 && (
          <OsintCard title="Top Carriers" icon={Zap} accent="#7000FF" testId="top-carriers">
            {db.top_carriers.map((c, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #111",
                fontSize: "0.75rem",
              }}>
                <span style={{ color: "#A0A0A0", fontFamily: "'JetBrains Mono', monospace" }}>{c.carrier}</span>
                <span style={{ color: "#E0E0E0", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{c.count}</span>
              </div>
            ))}
          </OsintCard>
        )}
      </div>

      {/* Cache Stats */}
      <div style={{ marginTop: 16 }}>
        <OsintCard title="Cache Statistics" icon={Database} accent="#FFD600" testId="cache-stats-section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <StatCard label="Hit Rate" value={`${(cacheStats.hit_rate || 0).toFixed(1)}%`} accent="#00FF94" />
            <StatCard label="Memory" value={cacheStats.memory_entries || 0} accent="#00F0FF" />
            <StatCard label="Disk" value={cacheStats.disk_entries || 0} accent="#7000FF" />
          </div>
        </OsintCard>
      </div>

      {/* Recent Analyses */}
      <div style={{ marginTop: 16 }}>
        <OsintCard title="Recent Analyses" icon={Clock} testId="recent-analyses">
          {recent.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%", borderCollapse: "collapse",
                fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace",
              }}>
                <thead>
                  <tr>
                    {["Phone", "Type", "Confidence", "Time", "Date"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px 12px",
                        background: "#050505", color: "#525252",
                        fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.1em", fontSize: "0.6rem",
                        borderBottom: "1px solid #222",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a, i) => (
                    <tr key={i}
                      style={{ transition: "background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#111"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={tdStyle}>{a.phone_number}</td>
                      <td style={tdStyle}>
                        <Badge variant={a.analysis_type === "deep_scan" ? "success" : "info"}>
                          {a.analysis_type}
                        </Badge>
                      </td>
                      <td style={tdStyle}>{a.confidence_score?.toFixed(1)}%</td>
                      <td style={tdStyle}>{a.processing_time?.toFixed(2)}s</td>
                      <td style={{ ...tdStyle, color: "#525252" }}>{a.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Clock} message="No analyses yet. Try analyzing a phone number." />
          )}
        </OsintCard>
      </div>
    </div>
  );
}

const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #111",
  color: "#A0A0A0",
  whiteSpace: "nowrap",
};
