import { useState } from "react";
import "./App.css";
import FuncionarioIndex from "./pages/funcionarios/FuncionarioIndex";
import SetoresIndex from "./pages/setores/SetoresIndex";
import TurnosIndex from "./pages/turnos/TurnosIndex";
import RelatoriosIndex from "./pages/relatorios/RelatoriosIndex";
import ConfiguracoesIndex from "./pages/configuracoes/ConfiguracoesIndex";

function App() {
  const [page, setPage] = useState("funcionarios");
  const [subPage, setSubPage] = useState("resumo");

  const goTo = (p) => (e) => {
    e.preventDefault();
    setPage(p);
    setSubPage("resumo");
  };

  const subTabs = {
    funcionarios: [
      "Funcionários",
      "🏖️ Férias / Afastamento",
      "🔀 Mudança de Folga",
      "🔄 Mudança de Turno/Setor",
    ],
    turnos: ["Turnos", "🗓️ Feriados / Eventos"],
    setores: ["Setores"],
    relatorios: ["📊 Zone", "📅 Escala Semanal"],
    configuracoes: ["Fluxo"],
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-label="Agenda">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 2.75a.75.75 0 0 1 .75.75V4h8.5V3.5a.75.75 0 0 1 1.5 0V4h1.25A2.75 2.75 0 0 1 21.75 6.75v11.5A2.75 2.75 0 0 1 19 21h-14A2.75 2.75 0 0 1 2.25 18.25V6.75A2.75 2.75 0 0 1 5 4h1.25V3.5A.75.75 0 0 1 7 2.75Zm12.25 6.5H4.75v8.5c0 .69.56 1.25 1.25 1.25h12c.69 0 1.25-.56 1.25-1.25v-8.5Zm-9.5 2.25h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm-9.5 3h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Z" />
            </svg>
          </div>
          <div>
            <p className="brand-name">
              Gestão de <span>Escala</span>
            </p>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navegação principal">
          <a
            href="#"
            onClick={goTo("funcionarios")}
            className={page === "funcionarios" ? "active" : ""}
          >
            Funcionários
          </a>
          <a
            href="#"
            onClick={goTo("turnos")}
            className={page === "turnos" ? "active" : ""}
          >
            Turnos
          </a>
          <a
            href="#"
            onClick={goTo("setores")}
            className={page === "setores" ? "active" : ""}
          >
            Setores
          </a>
          <a
            href="#"
            onClick={goTo("relatorios")}
            className={page === "relatorios" ? "active" : ""}
          >
            Relatórios
          </a>
          <a
            href="#"
            onClick={goTo("configuracoes")}
            className={page === "configuracoes" ? "active" : ""}
          >
            Configurações
          </a>
        </nav>

        <div className="user-box">
          <div className="user-avatar">AS</div>
          <div className="user-meta">
            <strong>Admin</strong>
            <span>Perfil</span>
          </div>
          <button type="button" className="logout-button">
            Sair
          </button>
        </div>
      </aside>

      <div className="main-panel">
        {page === "funcionarios" && (
          <FuncionarioIndex
            subTabs={subTabs}
            subPage={subPage}
            setSubPage={setSubPage}
          />
        )}
        {page === "setores" && (
          <SetoresIndex
            subTabs={subTabs}
            subPage={subPage}
            setSubPage={setSubPage}
          />
        )}
        {page === "turnos" && (
          <TurnosIndex
            subTabs={subTabs}
            subPage={subPage}
            setSubPage={setSubPage}
          />
        )}
        {page === "relatorios" && (
          <RelatoriosIndex
            subTabs={subTabs}
            subPage={subPage}
            setSubPage={setSubPage}
          />
        )}
        {page === "configuracoes" && (
          <ConfiguracoesIndex
            subTabs={subTabs}
            subPage={subPage}
            setSubPage={setSubPage}
          />
        )}
      </div>
    </div>
  );
}

export default App;
