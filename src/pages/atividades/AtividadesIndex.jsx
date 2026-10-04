import { useState } from "react";
import ListaAtividades from "./ListaAtividades";
import ReportModalActions from "../../components/ReportModalActions";

const SUB_TABS = [{ key: "atividades", label: "Atividades" }];

function AtividadesIndex() {
  const [subPage, setSubPage] = useState("atividades");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Atividades</h1>
        </div>
        <ReportModalActions />
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
        {subPage === "atividades" && <ListaAtividades />}
      </main>
    </div>
  );
}

export default AtividadesIndex;
