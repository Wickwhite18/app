import { useState } from "react";
import { Radio, Search, MapPin } from "lucide-react";
import api from "@/lib/api";
import {
  OsintCard, ResultRow, LoadingOverlay, OsintInput,
  OsintButton, EmptyState, Badge
} from "@/components/shared/OsintUI";

export default function TowerLookup() {
  const [form, setForm] = useState({ mcc: "", mnc: "", lac: "", cid: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.towerLookup(
        parseInt(form.mcc), parseInt(form.mnc),
        parseInt(form.lac), parseInt(form.cid)
      );
      setResult(res.data);
    } catch (err) {
      setResult({ found: false, error: err.response?.data?.detail || "Lookup failed" });
    } finally {
      setLoading(false);
    }
  };

  const tower = result?.tower;

  return (
    <div className="animate-fade-in" data-testid="tower-lookup-page">
      <OsintCard title="Cell Tower Lookup" icon={Radio} testId="tower-form-card">
        <p style={{
          fontSize: "0.7rem", color: "#525252",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 20, letterSpacing: "0.05em",
        }}>
          Look up a specific cell tower by its network identifiers (MCC/MNC/LAC/CID).
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <OsintInput label="MCC" required type="number" data-testid="mcc-input"
              value={form.mcc} onChange={(e) => setForm({ ...form, mcc: e.target.value })} placeholder="310" />
            <OsintInput label="MNC" required type="number" data-testid="mnc-input"
              value={form.mnc} onChange={(e) => setForm({ ...form, mnc: e.target.value })} placeholder="260" />
            <OsintInput label="LAC" required type="number" data-testid="lac-input"
              value={form.lac} onChange={(e) => setForm({ ...form, lac: e.target.value })} placeholder="7033" />
            <OsintInput label="CID" required type="number" data-testid="cid-input"
              value={form.cid} onChange={(e) => setForm({ ...form, cid: e.target.value })} placeholder="17811" />
            <OsintButton type="submit" loading={loading} data-testid="lookup-button">
              <Search size={14} />
              LOOKUP
            </OsintButton>
          </div>
        </form>
      </OsintCard>

      {loading && (
        <div style={{ marginTop: 24 }}>
          <OsintCard><LoadingOverlay message="QUERYING TOWER DATABASE..." /></OsintCard>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginTop: 24 }} className="animate-fade-in" data-testid="tower-results">
          {result.found && tower ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              <OsintCard title="Tower Identity" icon={Radio} accent="#00F0FF" testId="tower-identity-card">
                <ResultRow label="MCC" value={tower.mcc} />
                <ResultRow label="MNC" value={tower.mnc} />
                <ResultRow label="LAC" value={tower.lac} />
                <ResultRow label="CID" value={tower.cid} />
                <ResultRow label="Radio Type" value={tower.radio_type || "N/A"} />
                <ResultRow label="Source" value={tower.source || "N/A"} />
              </OsintCard>
              <OsintCard title="Tower Location" icon={MapPin} accent="#00FF94" testId="tower-location-card">
                <ResultRow label="Latitude" value={tower.lat != null ? tower.lat.toFixed(6) : "N/A"} />
                <ResultRow label="Longitude" value={tower.lon != null ? tower.lon.toFixed(6) : "N/A"} />
                <ResultRow label="Range" value={tower.range ? `${tower.range}m` : "N/A"} />
                <ResultRow label="Carrier" value={tower.carrier || "Unknown"} />
                <ResultRow label="Country" value={tower.country || "Unknown"} />
                <ResultRow label="Confidence" value={tower.confidence != null ? `${(tower.confidence * 100).toFixed(0)}%` : "N/A"} accent="#00FF94" />
                <ResultRow label="Samples" value={tower.samples || "N/A"} />
              </OsintCard>
            </div>
          ) : (
            <OsintCard testId="tower-not-found">
              <EmptyState icon={Radio} message="Tower not found in database or external APIs." />
            </OsintCard>
          )}
        </div>
      )}
    </div>
  );
}
