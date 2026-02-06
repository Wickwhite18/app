import { useState } from "react";
import { Phone, Shield, CheckCircle, XCircle, AlertTriangle, Radio, MapPin, Crosshair, FileText } from "lucide-react";
import api from "@/lib/api";
import {
  OsintCard, StatCard, ResultRow, ProgressBar, Badge,
  LoadingOverlay, OsintInput, OsintButton, EmptyState, ProcessingSteps
} from "@/components/shared/OsintUI";

export default function PhoneAnalysis() {
  const [phone, setPhone] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await api.analyzePhone(phone.trim(), deepScan);
      setResults(res.data);
    } catch (err) {
      setResults({ error: err.response?.data?.detail || "Analysis failed" });
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    low: "#00FF94",
    medium: "#FFD600",
    high: "#FF0055",
    critical: "#FF0055",
  };

  const bi = results?.basic_info || {};
  const val = results?.validation || {};
  const risk = results?.risk_assessment || {};
  const carrier = results?.carrier_info || {};
  const loc = results?.location_intelligence || {};
  const td = results?.tower_data || {};
  const geo = results?.geolocation || {};

  return (
    <div className="animate-fade-in" data-testid="phone-analysis-page">
      {/* Input Form */}
      <OsintCard title="Phone Number Analysis" icon={Phone} testId="phone-form-card">
        <p style={{
          fontSize: "0.7rem",
          color: "#525252",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 20,
          letterSpacing: "0.05em",
        }}>
          Enter a phone number with country code for comprehensive OSINT analysis.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 3, minWidth: 220 }}>
              <OsintInput
                label="Phone Number"
                required
                type="text"
                data-testid="phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
              <input
                type="checkbox"
                id="deep_scan"
                data-testid="deep-scan-toggle"
                checked={deepScan}
                onChange={(e) => setDeepScan(e.target.checked)}
                style={{ accentColor: "#00FF94", width: 14, height: 14 }}
              />
              <label htmlFor="deep_scan" style={{
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#A0A0A0",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
                Deep Scan
              </label>
            </div>
            <OsintButton type="submit" loading={loading} data-testid="analyze-button">
              <Crosshair size={14} />
              ANALYZE
            </OsintButton>
          </div>
        </form>
      </OsintCard>

      {/* Loading State */}
      {loading && (
        <div style={{ marginTop: 24 }}>
          <OsintCard testId="loading-card">
            <LoadingOverlay message="ANALYZING TARGET NUMBER..." />
          </OsintCard>
        </div>
      )}

      {/* Error */}
      {results?.error && !loading && (
        <div style={{ marginTop: 24 }}>
          <OsintCard title="Error" icon={XCircle} accent="#FF0055" testId="error-card">
            <p style={{ color: "#FF0055", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>
              {results.error}
            </p>
          </OsintCard>
        </div>
      )}

      {/* Results */}
      {results && !results.error && !loading && (
        <div style={{ marginTop: 24 }} className="animate-fade-in" data-testid="analysis-results">
          {/* Confidence Header */}
          <OsintCard testId="confidence-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#E0E0E0",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  Analysis Results
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  color: "#525252",
                  marginTop: 2,
                }}>
                  TARGET: {results.phone_number}
                </div>
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "2rem",
                fontWeight: 700,
                color: results.confidence_score >= 60 ? "#00FF94" : results.confidence_score >= 30 ? "#FFD600" : "#FF0055",
              }}>
                {results.confidence_score?.toFixed(1)}%
              </div>
            </div>
            <ProgressBar
              testId="confidence-bar"
              value={results.confidence_score || 0}
              label="Confidence Score"
              color={results.confidence_score >= 60 ? "#00FF94" : results.confidence_score >= 30 ? "#FFD600" : "#FF0055"}
            />
            {results.processing_time && (
              <div style={{
                fontSize: "0.6rem", color: "#333",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 8,
              }}>
                Processed in {results.processing_time}s
              </div>
            )}
          </OsintCard>

          {/* Grid of result sections */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}>
            {/* Basic Info */}
            <OsintCard title="Basic Info" icon={Phone} accent="#00F0FF" testId="basic-info-card">
              <ResultRow label="Formatted" value={bi.formatted || "N/A"} />
              <ResultRow label="Country Code" value={bi.country_code ? `+${bi.country_code}` : "N/A"} />
              <ResultRow label="Valid Format" value={bi.valid_format ? "YES" : "NO"} accent={bi.valid_format ? "#00FF94" : "#FF0055"} />
              <ResultRow label="National Number" value={bi.national_number || "N/A"} />
            </OsintCard>

            {/* Validation */}
            <OsintCard title="Validation" icon={CheckCircle} accent="#00FF94" testId="validation-card">
              <ResultRow label="Valid" value={val.valid ? "CONFIRMED" : "UNVERIFIED"} accent={val.valid ? "#00FF94" : "#FFD600"} />
              <ResultRow label="Line Type" value={val.line_type || "Unknown"} />
              <ResultRow label="Country" value={val.country || "Unknown"} />
              <ResultRow label="Services" value={val.services_checked?.join(", ") || "None"} />
            </OsintCard>

            {/* Risk Assessment */}
            <OsintCard title="Risk Assessment" icon={Shield} accent={riskColors[risk.risk_level] || "#00FF94"} testId="risk-card">
              <div style={{ marginBottom: 8 }}>
                <Badge variant={risk.risk_level === "low" ? "success" : risk.risk_level === "medium" ? "warning" : "danger"}>
                  {risk.risk_level?.toUpperCase() || "LOW"} RISK
                </Badge>
              </div>
              <ResultRow label="Risk Score" value={`${risk.risk_score || 0}/100`} />
              <ResultRow label="Fraud Score" value={risk.fraud_score || 0} />
              <ResultRow label="Spam Score" value={risk.spam_score || 0} />
              <ResultRow label="Disposable" value={risk.disposable ? "YES" : "NO"} accent={risk.disposable ? "#FFD600" : undefined} />
            </OsintCard>

            {/* Carrier Info */}
            <OsintCard title="Carrier Info" icon={Radio} accent="#7000FF" testId="carrier-card">
              <ResultRow label="Carrier" value={carrier.carrier || "Unknown"} />
              <ResultRow label="MCC" value={carrier.mcc || "N/A"} />
              <ResultRow label="MNC" value={carrier.mnc || "N/A"} />
              <ResultRow label="Line Type" value={carrier.line_type || "Unknown"} />
              <ResultRow label="Country" value={carrier.country || "Unknown"} />
            </OsintCard>
          </div>

          {/* Location Intelligence */}
          <div style={{ marginTop: 16 }}>
            <OsintCard title="Location Intelligence" icon={MapPin} accent="#00F0FF" testId="location-card">
              <ResultRow label="Country" value={loc.country || "Unknown"} />
              <ResultRow
                label="Estimated Lat/Lon"
                value={loc.estimated_location ? `${loc.estimated_location.lat}, ${loc.estimated_location.lon}` : "N/A"}
              />
              <ResultRow label="Accuracy" value={loc.accuracy_km ? `${loc.accuracy_km}km` : "N/A"} />
              <ResultRow label="Sources" value={loc.sources?.join(", ") || "None"} />
              {loc.address?.formatted && (
                <ResultRow label="Address" value={loc.address.formatted} accent="#00F0FF" />
              )}
            </OsintCard>
          </div>

          {/* Cell Towers */}
          <div style={{ marginTop: 16 }}>
            <OsintCard title="Cell Tower Data" icon={Radio} testId="towers-card">
              <ResultRow label="Towers Found" value={td.total_found || 0} accent={td.total_found > 0 ? "#00FF94" : undefined} />
              <ResultRow label="Sources" value={td.sources?.join(", ") || "None"} />
            </OsintCard>
          </div>

          {/* Geolocation */}
          {geo.best_location && (
            <div style={{ marginTop: 16 }}>
              <OsintCard title="Geolocation Result" icon={Crosshair} accent="#00FF94" testId="geolocation-card">
                <ResultRow label="Latitude" value={geo.best_location.lat} />
                <ResultRow label="Longitude" value={geo.best_location.lon} />
                <ResultRow label="Accuracy" value={`${geo.best_location.accuracy}m`} />
                <ResultRow label="Source" value={geo.best_location.source} />
                <ResultRow label="Confidence" value={`${(geo.best_location.confidence * 100).toFixed(0)}%`} accent="#00FF94" />
              </OsintCard>
            </div>
          )}

          {/* Processing Steps */}
          <div style={{ marginTop: 16 }}>
            <OsintCard title="Processing Log" icon={FileText} accent="#525252" testId="processing-log-card">
              <ProcessingSteps steps={results.processing_steps} />
            </OsintCard>
          </div>
        </div>
      )}
    </div>
  );
}
