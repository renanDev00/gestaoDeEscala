import ListaSetores from "./ListaSetores";

function SetoresIndex({ subTabs, subPage, setSubPage }) {
  return (
    <div>
      <header className="topbar">
        <div className="page-title">
          <span className="eyebrow">Visão geral</span>
          <h1>Setores</h1>
        </div>
      </header>

      <nav className="sub-nav" aria-label="Subnavegação">
        {(subTabs["setores"] || ["Resumo"]).map((tab) => {
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
        <ListaSetores />
      </main>
    </div>
  );
}

export default SetoresIndex;
