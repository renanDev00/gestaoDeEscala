import { useState } from "react";
import "./App.css";
import funcionarios from "./models/funcionarios";
import turnos from "./models/turnos";
import setores from "./models/setores";
import grupoDom from "./models/grupoDom";
import SetoresPage from "./pages/Setores";
import TurnosPage from "./pages/Turnos";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState("funcionarios");

  const goTo = (p) => (e) => {
    e.preventDefault();
    setPage(p);
  };

  return (
    <div className={`dashboard-shell ${isModalOpen ? "modal-open" : ""}`}>
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
        <header className="topbar">
          <div className="page-title">
            <span className="eyebrow">Visão geral</span>
            <h1>
              {page === "funcionarios"
                ? "Funcionários"
                : page === "turnos"
                  ? "Turnos"
                  : page === "setores"
                    ? "Setores"
                    : "Painel"}
            </h1>
          </div>
        </header>

        <main className="content">
          {page === "funcionarios" && (
            <section className="table-panel">
              <div className="panel-header">
                <h2>Lista de funcionários</h2>
                <div className="search-box">
                  <input type="text" placeholder="Pesquisar funcionário" />
                </div>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Adicionar
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Setor</th>
                      <th>Turno</th>
                      <th>Folga</th>
                      <th>Grupo Dom.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.map((funcionario) => (
                      <tr key={funcionario.nome}>
                        <td>{funcionario.nome}</td>
                        <td>
                          {setores[funcionario.setor - 1]?.nome ||
                            "Setor não encontrado"}
                        </td>
                        <td>
                          {turnos[funcionario.turno - 1]?.nome ||
                            "Turno não encontrado"}
                        </td>
                        <td>{funcionario.folga}</td>
                        <td>
                          {grupoDom[funcionario.grupoDom - 1]?.nome || "-"}
                        </td>
                        <td className="actions">
                          <button
                            className="btn edit"
                            aria-label={`Editar ${funcionario.nome}`}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                            </svg>
                          </button>
                          <button
                            className="btn delete"
                            aria-label={`Excluir ${funcionario.nome}`}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === "setores" && <SetoresPage />}
          {page === "turnos" && <TurnosPage />}
        </main>
      </div>

      <div
        className={`modal-overlay ${isModalOpen ? "open" : ""}`}
        onClick={() => setIsModalOpen(false)}
      >
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <h3 id="modal-title">Adicionar funcionário</h3>
            <button
              type="button"
              className="close-button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <form className="employee-form">
            <div className="form-grid">
              <label>
                Nome
                <input type="text" placeholder="Digite o nome" />
              </label>
              <label>
                Folga
                <input type="text" placeholder="Ex: Segunda-feira" />
              </label>
              <label>
                Setor
                <input type="text" placeholder="Digite o setor" />
              </label>
              <label>
                Turno
                <select defaultValue="">
                  <option value="" disabled>
                    Selecione o turno
                  </option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </label>
              <label>
                Grupo Dom.
                <select defaultValue="">
                  <option value="" disabled>
                    Selecione o grupo
                  </option>
                  <option value="Grupo A">Grupo A</option>
                  <option value="Grupo B">Grupo B</option>
                  <option value="Grupo C">Grupo C</option>
                  <option value="Grupo D">Grupo D</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
