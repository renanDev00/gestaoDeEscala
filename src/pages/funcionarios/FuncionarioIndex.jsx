import { useState } from "react";
import ListaFuncionarios from "./ListaFuncionarios";
import Ausencias from "./Ausencias";
import MudancasTurnoSetor from "./MudancasTurnoSetor";
import TrocasFolga from "./TrocasFolga";
import ReportModalActions from "../../components/ReportModalActions";

const SUB_TABS = [
  { key: "funcionarios", label: "Funcionários" },
  { key: "ausencias", label: "Ausências" },
  { key: "mudancas", label: "Mudanças de Turno/Setor" },
  { key: "trocas", label: "Trocas de Folga" },
];

function FuncionarioIndex() {
  const [subPage, setSubPage] = useState("funcionarios");

  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Funcionários</h1>
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
        {subPage === "funcionarios" && <ListaFuncionarios />}
        {subPage === "ausencias" && <Ausencias />}
        {subPage === "mudancas" && <MudancasTurnoSetor />}
        {subPage === "trocas" && <TrocasFolga />}
      </main>
    </div>
  );
}

export default FuncionarioIndex;
