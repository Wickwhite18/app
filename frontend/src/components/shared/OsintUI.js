import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2, Radio as RadioIcon, MapPin, Phone as PhoneIcon, Activity, ChevronRight } from "lucide-react";

// Reusable card component
export function OsintCard({ title, icon: Icon, children, accent = "#00FF94", testId }) {
  return (
    <div data-testid={testId} style={{
      background: "#0A0A0A",
      border: "1px solid #222",
      padding: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 3, height: 3,
        borderTop: `2px solid ${accent}`,
        borderLeft: `2px solid ${accent}`,
      }} />
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 3, height: 3,
        borderBottom: `2px solid ${accent}`,
        borderRight: `2px solid ${accent}`,
      }} />
      {title && (
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid #181818",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          {Icon && <Icon size={15} color={accent} />}
          <h3 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#E0E0E0",
            textTransform: "uppercase",
          }}>
            {title}
          </h3>
        </div>
      )}
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  );
}

// Stat card component
export function StatCard({ label, value, extra, accent = "#00FF94", testId }) {
  return (
    <div data-testid={testId} style={{
      background: "#0A0A0A",
      border: "1px solid #181818",
      padding: "18px 20px",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 20, height: 2, background: accent,
      }} />
      <div style={{
        fontSize: "0.6rem",
        color: "#525252",
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "1.8rem",
        fontWeight: 700,
        fontFamily: "'Rajdhani', sans-serif",
        color: "#E0E0E0",
        lineHeight: 1,
      }}>
        {value}
      </div>
      {extra && (
        <div style={{
          fontSize: "0.65rem",
          color: "#525252",
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: 4,
        }}>
          {extra}
        </div>
      )}
    </div>
  );
}

// Result row
export function ResultRow({ label, value, accent }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #111",
      fontSize: "0.8rem",
    }}>
      <span style={{
        color: "#525252",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <span style={{
        color: accent || "#E0E0E0",
        fontWeight: 500,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.75rem",
      }}>
        {value}
      </span>
    </div>
  );
}

// Progress bar
export function ProgressBar({ value, label, color = "#00FF94", testId }) {
  return (
    <div data-testid={testId}>
      {label && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontSize: "0.7rem",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span style={{ color: "#525252", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
          <span style={{ color, fontWeight: 600 }}>{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</span>
        </div>
      )}
      <div style={{
        height: 4,
        background: "#151515",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${Math.min(typeof value === 'number' ? value : 0, 100)}%`,
          background: color,
          boxShadow: `0 0 8px ${color}40`,
          transition: "width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }} />
      </div>
    </div>
  );
}

// Badge component
export function Badge({ variant = "default", children }) {
  const styles = {
    success: { background: "rgba(0,255,148,0.1)", color: "#00FF94", border: "1px solid rgba(0,255,148,0.2)" },
    danger: { background: "rgba(255,0,85,0.1)", color: "#FF0055", border: "1px solid rgba(255,0,85,0.2)" },
    warning: { background: "rgba(255,214,0,0.1)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.2)" },
    info: { background: "rgba(0,240,255,0.1)", color: "#00F0FF", border: "1px solid rgba(0,240,255,0.2)" },
    default: { background: "#151515", color: "#A0A0A0", border: "1px solid #222" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      ...s,
      display: "inline-block",
      padding: "2px 10px",
      fontSize: "0.6rem",
      fontWeight: 700,
      fontFamily: "'Rajdhani', sans-serif",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

// Loading spinner
export function LoadingOverlay({ message = "SCANNING..." }) {
  return (
    <div data-testid="loading-overlay" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 48,
      gap: 16,
    }}>
      <Loader2 size={32} color="#00FF94" style={{ animation: "spin 1s linear infinite" }} />
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.75rem",
        color: "#00FF94",
        letterSpacing: "0.2em",
      }}>
        {message}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Input field
export function OsintInput({ label, required, ...props }) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      {label && (
        <label style={{
          display: "block",
          fontSize: "0.6rem",
          fontFamily: "'JetBrains Mono', monospace",
          color: "#525252",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginBottom: 6,
        }}>
          {label}
          {required && <span style={{ color: "#FF0055", marginLeft: 4 }}>*</span>}
        </label>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#050505",
          border: "1px solid #222",
          color: "#E0E0E0",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.8rem",
          outline: "none",
          transition: "border-color 0.2s",
          ...(props.style || {}),
        }}
        onFocus={(e) => { e.target.style.borderColor = "#00FF94"; }}
        onBlur={(e) => { e.target.style.borderColor = "#222"; }}
      />
    </div>
  );
}

// Button
export function OsintButton({ variant = "primary", loading, children, ...props }) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 24px",
    fontSize: "0.7rem",
    fontWeight: 700,
    fontFamily: "'Rajdhani', sans-serif",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    border: "none",
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? 0.7 : 1,
    transition: "background 0.2s, box-shadow 0.2s, opacity 0.2s",
  };
  const variants = {
    primary: {
      ...baseStyle,
      background: "#00FF94",
      color: "#050505",
    },
    secondary: {
      ...baseStyle,
      background: "transparent",
      border: "1px solid #00F0FF",
      color: "#00F0FF",
    },
    danger: {
      ...baseStyle,
      background: "transparent",
      border: "1px solid #FF0055",
      color: "#FF0055",
    },
    ghost: {
      ...baseStyle,
      background: "transparent",
      border: "1px solid #333",
      color: "#A0A0A0",
    },
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={variants[variant] || variants.primary}
    >
      {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

// Empty state
export function EmptyState({ icon: Icon = Activity, message }) {
  return (
    <div style={{
      textAlign: "center",
      padding: 48,
      color: "#333",
    }}>
      <Icon size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.75rem",
        letterSpacing: "0.1em",
      }}>
        {message}
      </div>
    </div>
  );
}

// Processing steps indicator
export function ProcessingSteps({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {steps.map((step, i) => (
        <div key={i} className="animate-slide-in" style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: "0.7rem",
          fontFamily: "'JetBrains Mono', monospace",
          animationDelay: `${i * 0.05}s`,
          opacity: 0,
          animationFillMode: "forwards",
        }}>
          <CheckCircle size={12} color="#00FF94" />
          <span style={{ color: "#A0A0A0" }}>{step}</span>
        </div>
      ))}
    </div>
  );
}
