import ListaFuncionarios from "./ListaFuncionarios";

function FuncionarioIndex({ subTabs, subPage, setSubPage }) {
  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Funcionários</h1>
        </div>
      </header>

      <nav className="sub-nav" aria-label="Subnavegação">
        {(subTabs["funcionarios"] || ["Resumo"]).map((tab) => {
          const tabKey = tab.toLowerCase().replace(/\s+/g, "-");
          const isActive = subPage === tabKey;

          return (
            <button
              key={tab}
              type="button"
              className={`sub-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setSubPage(tabKey)}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      <main className="content">
        <ListaFuncionarios />
      </main>
    </div>
  );
}

export default FuncionarioIndex;
