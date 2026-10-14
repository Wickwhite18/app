import { useEffect, useState } from "react";
import { ChevronDown, CircleDot, Download, FileUp, Layers3, LocateFixed, MapPin, Plus, Radio, Route, Search, SlidersHorizontal, Trash2, Wifi } from "lucide-react";
import { downloadExport, getGeofences, getHealth, getHistory, getMonitor, importForensics, locate } from "@/lib/geoengine";

const initialCell = { mcc: "310", mnc: "260", lac: "40495", cid: "17811", radio: "lte", signal: "-83" };
const cellFields = [["mcc", "MCC"], ["mnc", "MNC"], ["lac", "TAC / LAC"], ["cid", "CELL ID"], ["radio", "RADIO"], ["signal", "SIGNAL (dBm)"]];

function PageHeading({ eyebrow, title, children }) {
  return <div className="page-heading"><div><p>{eyebrow}</p><h1>{title}</h1></div>{children}</div>;
}
function Panel({ title, action, children }) {
  return <section className="panel"><div className="panel-head"><h2>{title}</h2>{action}</div>{children}</section>;
}
function Button({ children, muted, type = "button", ...props }) {
  return <button type={type} {...props} className={`button ${muted ? "muted" : ""}`}>{children}</button>;
}
function Map({ compact = false, position }) {
  return <div className={`map ${compact ? "map-compact" : ""}`} aria-label="Location map preview">
    <div className="map-grid" /><div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" />
    <div className="map-label label-a">Seattle</div><div className="map-label label-b">Capitol Hill</div>
    {position && <div className="accuracy-ring"><div className="map-pin"><MapPin size={22} fill="currentColor" /></div></div>}
    <div className="map-zoom"><button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button></div><div className="map-credit">© OpenStreetMap</div>
  </div>;
}
function resultValue(result, names, fallback = "—") {
  for (const name of names) if (result?.[name] !== undefined && result[name] !== null) return result[name];
  return fallback;
}
function Result({ result }) {
  const latitude = resultValue(result, ["latitude", "lat"]);
  const longitude = resultValue(result, ["longitude", "lon", "lng"]);
  const accuracy = resultValue(result, ["accuracy", "accuracy_m"]);
  const confidence = resultValue(result, ["confidence", "confidence_score"]);
  const providers = result?.providers || result?.contributing_providers || [];
  return <Panel title="Fused result" action={<span className="pill green"><CircleDot size={12} /> FIX RECEIVED</span>}><div className="result">
    <div className="coordinates"><div><span>LATITUDE</span><strong>{latitude}</strong></div><div><span>LONGITUDE</span><strong>{longitude}</strong></div></div><div className="result-rule" />
    <div className="result-metrics"><div><span>ACCURACY</span><b>{accuracy} <em>{accuracy === "—" ? "" : "m"}</em></b></div><div><span>CONFIDENCE</span><b>{confidence}</b></div><div><span>FIX TYPE</span><b>Fused</b><small>{providers.length || "Multiple"} providers</small></div></div>
    <div className="provider-row"><span>CONTRIBUTING PROVIDERS</span><div>{providers.length ? providers.join(" · ") : "Reported by backend"}</div></div>
  </div></Panel>;
}

export function LocatePage() {
  const [cells, setCells] = useState([initialCell]); const [wifiText, setWifiText] = useState(""); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const updateCell = (index, key, value) => setCells(cells.map((cell, cellIndex) => cellIndex === index ? { ...cell, [key]: value } : cell));
  const addCell = () => setCells([...cells, { ...initialCell, cid: "" }]);
  const removeCell = (index) => setCells(cells.filter((_, cellIndex) => cellIndex !== index));
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); setResult(null); try { const wifi = wifiText.split(/[\s,]+/).filter(Boolean); setResult(await locate({ cells: cells.map((cell) => ({ ...cell, mcc: Number(cell.mcc), mnc: Number(cell.mnc), lac: Number(cell.lac), cid: Number(cell.cid), signal: Number(cell.signal) })), ...(wifi.length ? { wifi } : {}) })); } catch (requestError) { setError(requestError.message || "Unable to reach Geoengine."); } finally { setLoading(false); } };
  return <><PageHeading eyebrow="Location intelligence" title="Locate a device"><div className="page-heading-action"><span>BACKEND ROUTE</span><b>POST /locate</b></div></PageHeading><div className="locate-grid"><div className="left-stack">
    <form onSubmit={submit}><Panel title="Cell observations" action={<button className="text-button" type="button" onClick={addCell}><Plus size={14} /> Add observation</button>}><p className="helper">Enter observed cells. Your Geoengine service owns provider access, fusion, caching, and forensics.</p>{cells.map((cell, index) => <div className="field-grid" key={index}>{cells.length > 1 && <div className="observation-heading"><b className="observation-label">OBSERVATION {index + 1}</b><button type="button" className="remove-observation" onClick={() => removeCell(index)}><Trash2 size={13} /> Remove</button></div>}{cellFields.map(([key, label]) => <label key={key}>{label}<div className="field"><input value={cell[key]} onChange={(event) => updateCell(index, key, event.target.value)} aria-label={`${label} observation ${index + 1}`} />{key === "radio" && <ChevronDown size={15} />}</div></label>)}</div>)}<label className="wifi-row"><Wifi size={17} /><span><b>Wi‑Fi BSSIDs</b><small>Optional · comma or space separated</small></span><input value={wifiText} onChange={(event) => setWifiText(event.target.value)} placeholder="00:11:22:33:44:55" aria-label="Wi-Fi BSSIDs" /></label><div className="submit-row"><Button type="submit" disabled={loading}><LocateFixed size={16} /> {loading ? "Locating…" : "Locate device"}</Button><span>Keys remain on the server-side proxy.</span></div></Panel></form>
    {error && <div className="notice error"><CircleDot size={18} /><div><b>Backend unreachable</b><p>{error}</p></div></div>}{result && <Result result={result} />}
  </div><div className="right-stack"><Panel title="Fix preview" action={<button className="map-control" type="button"><Layers3 size={15} /> Standard</button>}><Map position={result} /><div className="map-caption"><div><span>ESTIMATED POSITION</span><b>{result ? "Resolved by Geoengine" : "Awaiting a location fix"}</b></div><div><span>RADIUS</span><b>{resultValue(result, ["accuracy", "accuracy_m"], "—")} {result ? "m" : ""}</b></div></div></Panel><div className="notice"><CircleDot size={18} /><div><b>Use responsibly</b><p>This console is for authorized devices and consented datasets only. It does not perform phone-number lookups.</p></div></div></div></div></>;
}

function Metric({ label, value, detail }) { return <div className="metric"><span>{label}</span><b>{value}</b><small>{detail}</small></div>; }
export function MonitorPage() {
  const [monitor, setMonitor] = useState(null); const [enabled, setEnabled] = useState(false);
  useEffect(() => { if (!enabled) return undefined; const poll = () => getMonitor().then(setMonitor).catch(() => setMonitor(null)); poll(); const interval = window.setInterval(poll, 10000); return () => window.clearInterval(interval); }, [enabled]);
  return <><PageHeading eyebrow="Streamed position fixes" title="Live monitor"><Button onClick={() => setEnabled(!enabled)}><Radio size={15} /> {enabled ? "Stop monitoring" : "Start monitoring"}</Button></PageHeading><div className="metric-row"><Metric label="Live fixes" value={monitor?.count ?? "—"} detail="current session" /><Metric label="Track distance" value={monitor?.distance ?? "—"} detail="reported by backend" /><Metric label="Current speed" value={monitor?.speed ?? "—"} detail={monitor?.heading ? `heading ${monitor.heading}°` : "waiting for fix"} /></div><Panel title="Live track" action={<span className={`pill ${enabled ? "green" : ""}`}>{enabled ? "POLLING · 10S" : "POLLING OFF"}</span>}><Map compact position={monitor?.latest || monitor} /></Panel></>;
}
export function GeofencesPage() {
  const [fences, setFences] = useState(null); const [error, setError] = useState("");
  useEffect(() => { getGeofences().then((data) => setFences(data.geofences || data)).catch((requestError) => setError(requestError.message)); }, []);
  return <><PageHeading eyebrow="Rules and alerts" title="Geofences"><Button><Plus size={15} /> New geofence</Button></PageHeading><div className="locate-grid"><Panel title="Defined fences">{error ? <Empty label="Backend unreachable" /> : fences?.length ? fences.map((fence) => <div className="fence" key={fence.id || fence.name}><MapPin size={17} /><div><b>{fence.name || "Unnamed fence"}</b><span>{fence.type || "Circle"} · {fence.radius ? `${fence.radius} m radius` : "configured"}</span></div><span className="pill green">ACTIVE</span></div>) : <Empty label="No geofences loaded" />}</Panel><Panel title="Fence editor"><Map /><div className="draw-tools"><Button><CircleDot size={15} /> Circle</Button><Button muted><Route size={15} /> Polygon</Button></div></Panel></div></>;
}
function Empty({ label }) { return <div className="empty-state"><MapPin size={20} /><b>{label}</b><span>Connect your Geoengine backend to view live data.</span></div>; }
export function HistoryPage() {
  const [history, setHistory] = useState(null); useEffect(() => { getHistory().then((data) => setHistory(data.items || data.fixes || data)).catch(() => setHistory([])); }, []);
  return <><PageHeading eyebrow="Resolved location archive" title="History"><div className="button-group"><Button muted onClick={() => downloadExport("csv")}><Download size={15} /> Export CSV</Button><Button muted><SlidersHorizontal size={15} /> Filters</Button></div></PageHeading><div className="metric-row"><Metric label="Locations" value={history?.length ?? "—"} detail="selected range" /><Metric label="Total distance" value="—" detail="reported by backend" /><Metric label="Average speed" value="—" detail="reported by backend" /><Metric label="Dwell time" value="—" detail="reported by backend" /></div><Panel title="Location records" action={<div className="search"><Search size={15} /> Search records</div>}>{history?.length ? <table><thead><tr><th>TIME</th><th>POSITION</th><th>ACCURACY</th><th>CONFIDENCE</th></tr></thead><tbody>{history.map((fix, index) => <tr key={fix.id || index}><td>{fix.time || fix.timestamp || "—"}</td><td>{fix.latitude ?? fix.lat ?? "—"}, {fix.longitude ?? fix.lon ?? "—"}</td><td>{fix.accuracy ?? "—"} m</td><td>{fix.confidence ?? "—"}</td></tr>)}</tbody></table> : <Empty label="No history loaded" />}</Panel></>;
}
export function ForensicsPage() {
  const [message, setMessage] = useState(""); const upload = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const result = await importForensics(file); setMessage(result.message || "Evidence import submitted."); } catch (requestError) { setMessage(requestError.message); } };
  return <><PageHeading eyebrow="Evidence review" title="Forensics"><Button muted onClick={() => downloadExport("forensics/csv")}><Download size={15} /> Export timeline</Button></PageHeading><div className="forensics"><Panel title="Import evidence"><label className="upload"><FileUp size={27} /><b>Drop an evidence file here</b><span>herrevad.db or Cellebrite CSV · up to 500 MB</span><span className="button muted">Browse files</span><input className="visually-hidden" type="file" accept=".db,.csv" onChange={upload} /></label>{message && <p className="upload-message">{message}</p>}</Panel><Panel title="Recent imports"><Empty label="No evidence imports" /></Panel></div></>;
}
export function SettingsPage() {
  const [health, setHealth] = useState(null); const [error, setError] = useState(""); const check = () => { setError(""); getHealth().then(setHealth).catch((requestError) => setError(requestError.message)); };
  return <><PageHeading eyebrow="Connection and capability" title="Settings" /><div className="settings-grid"><Panel title="Backend connection"><div className="setting"><div><b>Geoengine API</b><span>Configured server-side</span></div><span className={`pill ${health ? "green" : ""}`}>{health ? "HEALTHY" : "CHECK STATUS"}</span></div><div className="panel-action"><Button muted onClick={check}>Test connection</Button>{error && <span className="inline-error">{error}</span>}</div></Panel><Panel title="Provider status">{health?.providers?.length ? health.providers.map((provider) => <div className="provider" key={provider.name}><div><b>{provider.name}</b><span>{provider.status || "Reported by backend"}</span></div><span className="pill green">{provider.enabled ? "ENABLED" : "DISABLED"}</span></div>) : <Empty label="Provider status is reported by Geoengine" />}</Panel></div></>;
}
