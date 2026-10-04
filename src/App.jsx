import { useState, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock3,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  UsersRound,
} from "lucide-react";
import "./App.css";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import FuncionarioIndex from "./modules/funcionarios";
import AtividadesIndex from "./modules/atividades";
import SetoresIndex from "./modules/setores";
import TurnosIndex from "./modules/turnos";
import RelatoriosIndex from "./modules/relatorios";
import ConfiguracoesIndex from "./modules/configuracoes";

function App() {
  useTheme(); // aplica o tema salvo ao <html> na inicialização
  const [page, setPage] = useState("funcionarios");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true",
  );
  const [session, setSession] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const goTo = (p) => (e) => {
    e.preventDefault();
    setPage(p);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const nextCollapsed = !collapsed;
      localStorage.setItem("sidebar_collapsed", String(nextCollapsed));
      return nextCollapsed;
    });
  };

  if (isCheckingAuth) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          background: "var(--surface-soft)",
          color: "var(--orange-500)",
          fontWeight: "bold",
        }}
      >
        Carregando sistema...
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  return (
    <div
      className={`dashboard-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
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
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed ? "Expandir navegação" : "Recolher navegação"
            }
            title={
              sidebarCollapsed ? "Expandir navegação" : "Recolher navegação"
            }
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className="main-nav" aria-label="Navegação principal">
          <a
            href="#"
            onClick={goTo("funcionarios")}
            className={page === "funcionarios" ? "active" : ""}
            title="Funcionários"
          >
            <UsersRound size={17} aria-hidden="true" />
            <span>Funcionários</span>
          </a>
          <a
            href="#"
            onClick={goTo("turnos")}
            className={page === "turnos" ? "active" : ""}
            title="Turnos"
          >
            <Clock3 size={17} aria-hidden="true" />
            <span>Turnos</span>
          </a>
          <a
            href="#"
            onClick={goTo("atividades")}
            className={page === "atividades" ? "active" : ""}
            title="Atividades"
          >
            <Activity size={17} aria-hidden="true" />
            <span>Atividades</span>
          </a>
          <a
            href="#"
            onClick={goTo("setores")}
            className={page === "setores" ? "active" : ""}
            title="Setores"
          >
            <CalendarDays size={17} aria-hidden="true" />
            <span>Setores</span>
          </a>
          <a
            href="#"
            onClick={goTo("relatorios")}
            className={page === "relatorios" ? "active" : ""}
            title="Relatórios"
          >
            <BarChart3 size={17} aria-hidden="true" />
            <span>Relatórios</span>
          </a>
          <a
            href="#"
            onClick={goTo("configuracoes")}
            className={page === "configuracoes" ? "active" : ""}
            title="Configurações"
          >
            <Settings2 size={17} aria-hidden="true" />
            <span>Configurações</span>
          </a>
        </nav>

        <div className="user-box">
          <div className="user-avatar">
            {session?.user?.email?.slice(0, 2).toUpperCase() || "?"}
          </div>
          <div className="user-meta" title={session?.user?.email || "Usuário"}>
            <strong style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>
              {session?.user?.email || "Usuário"}
            </strong>
          </div>
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut size={15} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <div className="main-panel">
        {page === "funcionarios" && <FuncionarioIndex />}
        {page === "atividades" && <AtividadesIndex />}
        {page === "setores" && <SetoresIndex />}
        {page === "turnos" && <TurnosIndex />}
        {page === "relatorios" && <RelatoriosIndex />}
        {page === "configuracoes" && <ConfiguracoesIndex />}
      </div>
    </div>
  );
}

export default App;
