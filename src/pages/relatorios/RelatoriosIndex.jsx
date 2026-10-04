import { useState } from "react";
import { Target } from "lucide-react";
import ListaRelatorios from "./ListaRelatorios";
import CampanhaFtwRelatorio from "./CampanhaFtwRelatorio";
import ReportModalActions from "../../components/ReportModalActions";

const SUB_TABS = [
  { key: "resumo", label: "Resumo" },
  { key: "campanha-ftw", label: "Campanha FTW", icon: Target },
];

function RelatoriosIndex() {
  const [subPage, setSubPage] = useState("resumo");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Relatórios</h1>
        </div>
        <ReportModalActions />
      </header>

      <nav className="sub-nav" aria-label="Subnavegação de relatórios">
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`sub-nav-item ${subPage === key ? "active" : ""}`}
            onClick={() => setSubPage(key)}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {label}
          </button>
        ))}
      </nav>

      <main
        className={`content ${subPage === "campanha-ftw" ? "content--campaign" : ""}`}
      >
        {subPage === "resumo" && <ListaRelatorios />}
        {subPage === "campanha-ftw" && <CampanhaFtwRelatorio />}
      </main>
    </div>
  );
}

export default RelatoriosIndex;
