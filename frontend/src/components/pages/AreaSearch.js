import { useState } from "react";
import { MapPin, Search, Radio } from "lucide-react";
import api from "@/lib/api";
import {
  OsintCard, LoadingOverlay, OsintInput,
  OsintButton, EmptyState, Badge
} from "@/components/shared/OsintUI";

export default function AreaSearch() {
  const [form, setForm] = useState({ lat: "", lon: "", radius: "10", mcc: "", mnc: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.areaSearch(
        parseFloat(form.lat), parseFloat(form.lon), parseFloat(form.radius),
        form.mcc ? parseInt(form.mcc) : null,
        form.mnc ? parseInt(form.mnc) : null
      );
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.detail || "Search failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" data-testid="area-search-page">
      <OsintCard title="Area Search" icon={MapPin} testId="area-form-card">
        <p style={{
          fontSize: "0.7rem", color: "#525252",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 20, letterSpacing: "0.05em",
        }}>
          Find all cell towers within a geographic area. Optionally filter by MCC/MNC.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <OsintInput label="Latitude" required type="text" data-testid="lat-input"
              value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="38.9072" />
            <OsintInput label="Longitude" required type="text" data-testid="lon-input"
              value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} placeholder="-77.0369" />
            <OsintInput label="Radius (km)" required type="text" data-testid="radius-input"
              value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} placeholder="10" />
            <OsintInput label="MCC (optional)" type="text" data-testid="area-mcc-input"
              value={form.mcc} onChange={(e) => setForm({ ...form, mcc: e.target.value })} placeholder="310" />
            <OsintInput label="MNC (optional)" type="text" data-testid="area-mnc-input"
              value={form.mnc} onChange={(e) => setForm({ ...form, mnc: e.target.value })} placeholder="260" />
            <OsintButton type="submit" loading={loading} data-testid="search-button">
              <Search size={14} />
              SEARCH
            </OsintButton>
          </div>
        </form>
      </OsintCard>

      {loading && (
        <div style={{ marginTop: 24 }}>
          <OsintCard><LoadingOverlay message="SCANNING AREA..." /></OsintCard>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginTop: 24 }} className="animate-fade-in" data-testid="area-results">
          {result.error ? (
            <OsintCard>
              <p style={{ color: "#FF0055", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>{result.error}</p>
            </OsintCard>
          ) : result.towers && result.towers.length > 0 ? (
            <OsintCard title={`Found ${result.total} Tower(s)`} icon={Radio} accent="#00F0FF" testId="area-results-card">
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.7rem",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <thead>
                    <tr>
                      {["MCC", "MNC", "LAC", "CID", "LAT", "LON", "RANGE", "RADIO", "CARRIER", "DISTANCE"].map(h => (
                        <th key={h} style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          background: "#050505",
                          color: "#525252",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          fontSize: "0.6rem",
                          borderBottom: "1px solid #222",
                          whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.towers.map((t, i) => (
                      <tr key={i} style={{ transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#111"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={tdStyle}>{t.mcc}</td>
                        <td style={tdStyle}>{t.mnc}</td>
                        <td style={tdStyle}>{t.lac}</td>
                        <td style={tdStyle}>{t.cid}</td>
                        <td style={tdStyle}>{t.lat?.toFixed(4)}</td>
                        <td style={tdStyle}>{t.lon?.toFixed(4)}</td>
                        <td style={tdStyle}>{t.range}m</td>
                        <td style={tdStyle}>
                          <Badge variant={t.radio_type === "5G" ? "success" : "info"}>{t.radio_type || "?"}</Badge>
                        </td>
                        <td style={tdStyle}>{t.carrier || "-"}</td>
                        <td style={{ ...tdStyle, color: "#00FF94" }}>{t.distance?.toFixed(2)}km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OsintCard>
          ) : (
            <OsintCard testId="area-no-results">
              <EmptyState icon={MapPin} message="No towers found in this area. Try a larger radius." />
            </OsintCard>
          )}
        </div>
      )}
    </div>
  );
}

const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #111",
  color: "#A0A0A0",
  whiteSpace: "nowrap",
};
