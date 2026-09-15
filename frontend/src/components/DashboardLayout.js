import { Activity, CircleHelp, Crosshair, Database, MapPinned, RadioTower, Settings, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  ["/", Crosshair, "Locate"], ["/monitor", Activity, "Live monitor"], ["/geofences", MapPinned, "Geofences"],
  ["/history", Database, "History"], ["/forensics", RadioTower, "Forensics"], ["/settings", Settings, "Settings"],
];

export default function DashboardLayout() {
  return <div className="console-shell">
    <div className="scanline-overlay" />
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Crosshair size={22}/></div><div><b>GEOENGINE</b><span>OPERATIONS CONSOLE</span></div></div>
      <div className="nav-label">Workspace</div>
      <nav>{navigation.map(([to, Icon, label]) => <NavLink end={to === "/"} key={to} to={to} className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
      <div className="side-status"><div className="status-title"><span className="live-dot"/> Service status</div><b>BACKEND REACHABLE</b><small>Last checked just now</small></div>
      <div className="sidebar-footer"><ShieldCheck size={15}/><span>Authorized use only</span></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="crumb"><span>GEOENGINE</span><i>/</i><strong>LOCATION INTELLIGENCE</strong></div><div className="top-actions"><button className="icon-button"><CircleHelp size={17}/></button><span className="api-state"><span className="live-dot"/> API CONNECTED</span><div className="avatar">AM</div></div></header><div className="page-content"><Outlet /></div><footer>INTENDED FOR AUTHORIZED DEVICES ONLY <span>•</span> NOT A PHONE-NUMBER LOOKUP SERVICE</footer></main>
  </div>;
}
