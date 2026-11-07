import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes, Link } from "react-router-dom";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "./styles.css";
import { SimulationProvider } from "./hooks/useSimulation";
import { Layout } from "./components/layout/Layout";
import { Overview } from "./pages/Overview";
import { MapPage } from "./pages/MapPage";
import { AlertsPage } from "./pages/AlertsPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { ResultsPage } from "./pages/ResultsPage";
import { SettingsPage } from "./pages/SettingsPage";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SimulationProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="mapa" element={<MapPage />} />
            <Route path="alertas" element={<AlertsPage />} />
            <Route path="alertas/:id" element={<AlertsPage />} />
            <Route path="monitoramento" element={<MonitoringPage />} />
            <Route path="resultados" element={<ResultsPage />} />
            <Route path="simulador" element={<SimulatorPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route
              path="*"
              element={
                <>
                  <h1>Página não encontrada</h1>
                  <Link className="button" to="/">
                    Voltar à visão geral
                  </Link>
                </>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </SimulationProvider>
  </React.StrictMode>,
);
