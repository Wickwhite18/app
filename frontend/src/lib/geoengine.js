import { z } from "zod";

const proxyPath = "/api/geoengine";

export const locateRequestSchema = z.object({
  cells: z.array(z.object({
    mcc: z.number().int().min(1).max(999),
    mnc: z.number().int().min(0).max(999),
    lac: z.number().int().min(0),
    cid: z.number().int().min(0),
    radio: z.string().min(1),
    signal: z.number().finite().optional(),
  })).min(1),
  wifi: z.array(z.string().regex(/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i)).optional(),
});

export class GeoengineError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = "GeoengineError";
    this.status = status;
    this.body = body;
  }
}

function proxyUrl(path, params) {
  const search = params ? new URLSearchParams(params).toString() : "";
  return `${proxyPath}${path}${search ? `?${search}` : ""}`;
}

async function errorFor(response) {
  const text = await response.text();
  try {
    const body = JSON.parse(text);
    return new GeoengineError(body.detail || body.message || text, response.status, body);
  } catch {
    return new GeoengineError(text || `Geoengine request failed (${response.status})`, response.status);
  }
}

export async function geoengineRequest(path, { params, ...options } = {}) {
  const response = await fetch(proxyUrl(path, params), {
    ...options,
    headers: { accept: "application/json", ...options.headers },
  });
  if (!response.ok) throw await errorFor(response);
  if (response.status === 204) return null;
  return response.json();
}

export function locate(observations) {
  const payload = locateRequestSchema.parse(observations);
  return geoengineRequest("/locate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getHealth() {
  return geoengineRequest("/health");
}

export function getGeofences() {
  return geoengineRequest("/geofences");
}

export function createGeofence(fence) {
  return geoengineRequest("/geofences", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(fence),
  });
}

export function deleteGeofence(id) {
  return geoengineRequest(`/geofences/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getHistory(params = {}) {
  return geoengineRequest("/history", { params });
}

export function getMonitor() {
  return geoengineRequest("/monitor");
}

export function importForensics(file) {
  const formData = new FormData();
  formData.append("file", file);
  return geoengineRequest("/forensics/import", { method: "POST", body: formData });
}

export async function downloadExport(format, params = {}) {
  const response = await fetch(proxyUrl(`/exports/${format}`, params));
  if (!response.ok) throw await errorFor(response);
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `geoengine-export.${format}`;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
