import { useState } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import UploadFluxo from "../../components/uploadFluxo";
import GruposDomingo from "./GruposDomingo";

const SUB_TABS = [
  { key: "configuracoes", label: "Configurações Gerais" },
  { key: "fluxo", label: "Fluxo" },
  { key: "domingo", label: "Grupos de Domingo" },
];

function ConfiguracoesIndex() {
  const [subPage, setSubPage] = useState("configuracoes");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Configurações</h1>
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
        {subPage === "configuracoes" && <ThemeSelector />}
        {subPage === "fluxo" && <UploadFluxo />}
        {subPage === "domingo" && <GruposDomingo />}
      </main>
    </div>
  );
}

export default ConfiguracoesIndex;
