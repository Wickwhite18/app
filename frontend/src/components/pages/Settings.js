import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Eye, EyeOff, Save, ExternalLink, Shield, Key } from "lucide-react";
import api from "@/lib/api";
import { OsintCard, LoadingOverlay, OsintButton, Badge } from "@/components/shared/OsintUI";

const API_CONFIGS = [
  { key: "opencellid", label: "OpenCellID", desc: "Free cell tower database with global coverage", url: "https://opencellid.org/", required: true },
  { key: "google_geolocation", label: "Google Geolocation", desc: "High accuracy cell tower triangulation", url: "https://developers.google.com/maps/documentation/geolocation/overview", required: false },
  { key: "unwiredlabs", label: "UnwiredLabs", desc: "Location API with cell, WiFi, and IP geolocation", url: "https://unwiredlabs.com/", required: false },
  { key: "opencage", label: "OpenCage", desc: "Geocoding and reverse geocoding service", url: "https://opencagedata.com/", required: false },
  { key: "abstractapi", label: "AbstractAPI", desc: "Phone validation and carrier lookup", url: "https://www.abstractapi.com/phone-validation-api", required: false },
  { key: "numverify", label: "Numverify", desc: "Phone number validation API", url: "https://numverify.com/", required: false },
  { key: "ipqualityscore", label: "IPQualityScore", desc: "Phone fraud detection and risk scoring", url: "https://www.ipqualityscore.com/", required: false },
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [keyValues, setKeyValues] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const nonEmptyKeys = Object.fromEntries(
      Object.entries(keyValues).filter(([_, v]) => v.trim())
    );
    if (Object.keys(nonEmptyKeys).length === 0) return;
    setSaving(true);
    try {
      await api.updateSettings(nonEmptyKeys);
      setSaved(true);
      setKeyValues({});
      setTimeout(() => setSaved(false), 3000);
      await loadSettings();
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <OsintCard><LoadingOverlay message="LOADING CONFIGURATION..." /></OsintCard>;
  }

  return (
    <div className="animate-fade-in" data-testid="settings-page">
      <OsintCard title="API Configuration" icon={Key} testId="api-config-card">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20,
        }}>
          <p style={{
            fontSize: "0.7rem", color: "#525252",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.05em",
          }}>
            Configure API keys for external data sources. Keys are stored in config/api_config.json.
          </p>
          <OsintButton variant="ghost" onClick={() => setShowKeys(!showKeys)} data-testid="toggle-keys-button">
            {showKeys ? <EyeOff size={14} /> : <Eye size={14} />}
            {showKeys ? "HIDE" : "SHOW"}
          </OsintButton>
        </div>

        {saved && (
          <div style={{
            background: "rgba(0,255,148,0.08)",
            border: "1px solid rgba(0,255,148,0.2)",
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            color: "#00FF94",
          }} data-testid="save-success-message">
            API KEYS SAVED SUCCESSFULLY
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {API_CONFIGS.map((cfg) => {
            const apiKeyInfo = settings?.api_keys?.[cfg.key];
            const isConfigured = apiKeyInfo?.configured;
            return (
              <div key={cfg.key} style={{
                padding: "16px 0",
                borderBottom: "1px solid #111",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.85rem", fontWeight: 600,
                      color: "#E0E0E0", letterSpacing: "0.05em",
                    }}>
                      {cfg.label}
                    </span>
                    <Badge variant={cfg.required ? "danger" : "info"}>
                      {cfg.required ? "REQUIRED" : "OPTIONAL"}
                    </Badge>
                    {isConfigured && (
                      <Badge variant="success">CONFIGURED</Badge>
                    )}
                  </div>
                  <a href={cfg.url} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: "0.65rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#00F0FF",
                    textDecoration: "none",
                  }}>
                    GET KEY <ExternalLink size={10} />
                  </a>
                </div>
                <p style={{
                  fontSize: "0.65rem", color: "#333",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 10,
                }}>
                  {cfg.desc}
                </p>
                <input
                  type={showKeys ? "text" : "password"}
                  data-testid={`api-key-${cfg.key}`}
                  value={keyValues[cfg.key] || ""}
                  onChange={(e) => setKeyValues({ ...keyValues, [cfg.key]: e.target.value })}
                  placeholder={isConfigured ? apiKeyInfo.masked : `Enter ${cfg.label} API key`}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#050505",
                    border: "1px solid #222",
                    color: "#E0E0E0",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.75rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#00FF94"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#222"; }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20 }}>
          <OsintButton onClick={handleSave} loading={saving} data-testid="save-keys-button">
            <Save size={14} />
            SAVE ALL KEYS
          </OsintButton>
        </div>
      </OsintCard>

      {/* Security Notice */}
      <div style={{ marginTop: 16 }}>
        <OsintCard title="Security Notice" icon={Shield} accent="#FF0055" testId="security-notice">
          <p style={{
            fontSize: "0.7rem", color: "#A0A0A0",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.6,
          }}>
            API keys are stored locally in{" "}
            <code style={{ color: "#00F0FF", background: "#111", padding: "2px 6px" }}>config/api_config.json</code>.
            For production deployments, use environment variables or a dedicated secrets manager.
          </p>
        </OsintCard>
      </div>
    </div>
  );
}
