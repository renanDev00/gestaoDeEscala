import { useState } from "react";
import ListaRelatorios from "./ListaRelatorios";
import ZoneRelatorio from "./ZoneRelatorio";
import SemanalRelatorio from "./SemanalRelatorio";

const SUB_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "zone", label: "Zone" },
  { key: "semanal", label: "Semanal" },
];

function RelatoriosIndex() {
  const [subPage, setSubPage] = useState("dashboard");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Relatórios</h1>
        </div>
      </header>

      <nav className="sub-nav" aria-label="Subnavegação">
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`sub-nav-item ${subPage === key ? "active" : ""}`}
            onClick={() => setSubPage(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="content">
        {subPage === "dashboard" && <ListaRelatorios />}
        {subPage === "zone" && <ZoneRelatorio />}
        {subPage === "semanal" && <SemanalRelatorio />}
      </main>
    </div>
  );
}

export default RelatoriosIndex;
