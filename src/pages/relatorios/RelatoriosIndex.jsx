import ListaRelatorios from "./ListaRelatorios";
import ReportModalActions from "../../components/ReportModalActions";

function RelatoriosIndex() {
  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Relatórios</h1>
        </div>
        <ReportModalActions />
      </header>

      <main className="content">
        <ListaRelatorios />
      </main>
    </div>
  );
}

export default RelatoriosIndex;
