import { useState } from "react";
import ListaTurnos from "./ListaTurnos";

const SUB_TABS = [
  { key: "turnos", label: "Turnos" },
];

function TurnosIndex() {
  const [subPage, setSubPage] = useState("turnos");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Turnos</h1>
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
        {subPage === "turnos" && <ListaTurnos />}
      </main>
    </div>
  );
}

export default TurnosIndex;
