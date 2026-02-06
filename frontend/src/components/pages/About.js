import { Radio, Code, Shield, Cpu, Globe, Zap, ChevronRight } from "lucide-react";
import { OsintCard, Badge } from "@/components/shared/OsintUI";

const features = [
  { icon: Radio, label: "Multi-Source Tower Intelligence", desc: "Aggregate cell tower data from OpenCellID, Google Geolocation, UnwiredLabs, and local database" },
  { icon: Shield, label: "Phone Number Risk Analysis", desc: "Validate numbers, identify carriers, assess fraud/spam risk via IPQualityScore" },
  { icon: Globe, label: "Geolocation & Triangulation", desc: "Estimate locations using weighted centroid and Google Geolocation API triangulation" },
  { icon: Cpu, label: "Smart Caching System", desc: "Memory + disk cache with zlib compression, configurable TTL, and rate limiting" },
  { icon: Zap, label: "Concurrent API Requests", desc: "ThreadPoolExecutor for parallel API calls with retry logic and exponential backoff" },
  { icon: Code, label: "REST API Endpoints", desc: "Full JSON API for integration with external tools and automation scripts" },
];

const techStack = [
  "FastAPI (Python 3.x)",
  "React 19",
  "SQLite (OSINT Database)",
  "Tailwind CSS",
  "OpenCellID API",
  "Google Geolocation API",
  "IPQualityScore API",
  "Lucide React Icons",
];

export default function About() {
  return (
    <div className="animate-fade-in" data-testid="about-page">
      {/* Hero */}
      <div style={{
        background: "#0A0A0A",
        border: "1px solid #222",
        padding: "48px 40px",
        position: "relative",
        overflow: "hidden",
        marginBottom: 24,
      }}>
        {/* Corner accents */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTop: "2px solid #00FF94", borderLeft: "2px solid #00FF94" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTop: "2px solid #00FF94", borderRight: "2px solid #00FF94" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottom: "2px solid #00FF94", borderLeft: "2px solid #00FF94" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottom: "2px solid #00FF94", borderRight: "2px solid #00FF94" }} />

        <div style={{ textAlign: "left", maxWidth: 700 }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.65rem",
            color: "#00FF94",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Intelligence Platform
          </div>
          <h1 data-testid="about-title" style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#E0E0E0",
            letterSpacing: "0.08em",
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            CELL TOWER OSINT PRO
          </h1>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 20,
          }}>
            <Badge variant="success">v13.0</Badge>
            <Badge variant="info">FLASK EDITION</Badge>
            <Badge>2026</Badge>
          </div>
          <p style={{
            fontSize: "0.8rem",
            color: "#A0A0A0",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.7,
            maxWidth: 600,
          }}>
            A comprehensive multi-source intelligence platform for cellular network
            analysis, phone number OSINT, and cell tower geolocation. Built for
            security researchers and intelligence analysts.
          </p>
        </div>
      </div>

      {/* Developer Credits */}
      <OsintCard testId="developer-credits-card">
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}>
          <div style={{
            width: 72, height: 72,
            background: "#050505",
            border: "2px solid #00FF94",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 20px rgba(0,255,148,0.15)",
          }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#00FF94",
            }}>
              MW
            </span>
          </div>
          <div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              color: "#525252",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}>
              DEVELOPER
            </div>
            <div data-testid="developer-name" className="glitch-text" style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#00FF94",
              letterSpacing: "0.1em",
              cursor: "default",
              textShadow: "0 0 10px rgba(0,255,148,0.3)",
            }}>
              Mr~Wh!te
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              color: "#525252",
              marginTop: 4,
            }}>
              OSINT PRO v13.0 // CELL TOWER INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>
      </OsintCard>

      {/* Features */}
      <div style={{ marginTop: 24 }}>
        <OsintCard title="Platform Features" icon={Zap} accent="#00F0FF" testId="features-card">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  background: "#050505",
                  border: "1px solid #181818",
                  padding: 16,
                  display: "flex",
                  gap: 14,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#333"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#181818"}>
                  <Icon size={18} color="#00F0FF" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#E0E0E0",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}>
                      {f.label}
                    </div>
                    <div style={{
                      fontSize: "0.65rem",
                      color: "#525252",
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.5,
                    }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </OsintCard>
      </div>

      {/* Tech Stack */}
      <div style={{ marginTop: 16 }}>
        <OsintCard title="Technology Stack" icon={Code} accent="#7000FF" testId="tech-stack-card">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {techStack.map((tech, i) => (
              <span key={i} style={{
                background: "#050505",
                border: "1px solid #222",
                padding: "6px 14px",
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#A0A0A0",
                letterSpacing: "0.05em",
              }}>
                {tech}
              </span>
            ))}
          </div>
        </OsintCard>
      </div>
    </div>
  );
}
