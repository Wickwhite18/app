import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "@/App.css";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ForensicsPage,
  GeofencesPage,
  HistoryPage,
  LocatePage,
  MonitorPage,
  SettingsPage,
} from "@/components/pages/GeoenginePages";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<LocatePage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/geofences" element={<GeofencesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/forensics" element={<ForensicsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
