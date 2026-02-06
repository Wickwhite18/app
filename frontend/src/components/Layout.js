import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Radio, Phone, MapPin, BarChart3, Settings, Trash2, Info, ChevronRight } from "lucide-react";

const navItems = [
  { to: "/", icon: Phone, label: "PHONE ANALYSIS" },
  { to: "/tower", icon: Radio, label: "TOWER LOOKUP" },
  { to: "/area", icon: MapPin, label: "AREA SEARCH" },
  { to: "/stats", icon: BarChart3, label: "STATISTICS" },
  { to: "/settings", icon: Settings, label: "API KEYS" },
  { to: "/cache", icon: Trash2, label: "CACHE" },
  { to: "/about", icon: Info, label: "ABOUT" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#050505" }}>
      {/* Header */}
      <header data-testid="app-header" style={{
        background: "#0A0A0A",
        borderBottom: "1px solid #222",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 36, height: 36,
            border: "2px solid #00FF94",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <Radio size={18} color="#00FF94" />
            <div style={{
              position: "absolute", top: -2, right: -2,
              width: 6, height: 6, background: "#00FF94",
              borderRadius: "50%",
              boxShadow: "0 0 8px #00FF94",
              animation: "pulse-glow 2s infinite",
            }} />
          </div>
          <div>
            <h1 data-testid="app-title" style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#E0E0E0",
              letterSpacing: "0.1em",
              lineHeight: 1.2,
            }}>
              CELL TOWER OSINT PRO
              <span style={{
                marginLeft: 10,
                fontSize: "0.6rem",
                background: "#00FF94",
                color: "#050505",
                padding: "2px 8px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                verticalAlign: "middle",
              }}>v13.0</span>
            </h1>
            <p style={{
              fontSize: "0.65rem",
              color: "#525252",
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
            }}>
              Multi-Source Intelligence Platform
            </p>
          </div>
        </div>
        <div style={{
          fontSize: "0.65rem",
          color: "#525252",
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ color: "#00FF94" }}>SYS:ONLINE</span>
          <span style={{ width: 1, height: 14, background: "#333" }} />
          <span>BY Mr~Wh!te</span>
        </div>
      </header>

      {/* Navigation */}
      <nav data-testid="main-nav" style={{
        background: "#0A0A0A",
        borderBottom: "1px solid #181818",
        display: "flex",
        gap: 0,
        overflowX: "auto",
        paddingLeft: 24,
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 18px",
                fontSize: "0.7rem",
                fontWeight: 600,
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: "0.12em",
                color: isActive ? "#00FF94" : "#525252",
                borderBottom: isActive ? "2px solid #00FF94" : "2px solid transparent",
                background: isActive ? "rgba(0,255,148,0.04)" : "transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.2s, border-color 0.2s, background 0.2s",
              }}
            >
              <Icon size={14} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Content */}
      <main style={{
        flex: 1,
        maxWidth: 1400,
        width: "100%",
        margin: "0 auto",
        padding: "32px 24px 80px",
      }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer data-testid="app-footer" style={{
        background: "#0A0A0A",
        borderTop: "1px solid #181818",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.65rem",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#333",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#00FF94", fontWeight: 600 }}>OSINT PRO v13.0</span>
          <ChevronRight size={10} />
          <span>Cell Tower Intelligence Platform</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Developed by</span>
          <span data-testid="developer-credit" className="glitch-text" style={{
            color: "#00FF94",
            fontWeight: 600,
            letterSpacing: "0.1em",
            cursor: "default",
          }}>Mr~Wh!te</span>
        </div>
      </footer>
    </div>
  );
}
