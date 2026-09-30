import { useState } from "react";
import ListaSetores from "./ListaSetores";

const SUB_TABS = [
  { key: "setores", label: "Setores" },
];

function SetoresIndex() {
  const [subPage, setSubPage] = useState("setores");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Setores</h1>
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
        {subPage === "setores" && <ListaSetores />}
      </main>
    </div>
  );
}

export default SetoresIndex;
