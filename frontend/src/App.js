import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import Layout from "@/components/Layout";
import PhoneAnalysis from "@/components/pages/PhoneAnalysis";
import TowerLookup from "@/components/pages/TowerLookup";
import AreaSearch from "@/components/pages/AreaSearch";
import Statistics from "@/components/pages/Statistics";
import Settings from "@/components/pages/Settings";
import CacheManagement from "@/components/pages/CacheManagement";
import About from "@/components/pages/About";

function App() {
  return (
    <BrowserRouter>
      <div className="scanline-overlay" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PhoneAnalysis />} />
          <Route path="/tower" element={<TowerLookup />} />
          <Route path="/area" element={<AreaSearch />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cache" element={<CacheManagement />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
