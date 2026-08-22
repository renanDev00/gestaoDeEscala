import { useState } from "react";
import setores from "../models/setores";

export default function SetoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    nome: "",
    minimoFuncionarios: "",
    atividadePadrao: "",
    cor: "#FF5733",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Salvar setor:", formValues);
    setIsModalOpen(false);
    setFormValues({
      nome: "",
      minimoFuncionarios: "",
      atividadePadrao: "",
      cor: "#FF5733",
    });
  };

  return (
    <section className="table-panel">
      <div className="panel-header">
        <h2>Lista de setores</h2>
        <div className="search-box">
          <input type="text" placeholder="Pesquisar setor" />
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
              <th>ID</th>
              <th>Nome</th>
              <th>Mínimo</th>
              <th>Atividade</th>
              <th>Cor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {setores.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.nome}</td>
                <td>{s.minimoFuncionarios}</td>
                <td>{s.atividadePadrao || "-"}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: s.cor,
                    }}
                    aria-hidden="true"
                  ></span>
                </td>
                <td className="actions">
                  <button
                    className="btn edit"
                    aria-label={`Editar setor ${s.nome}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                    </svg>
                  </button>
                  <button
                    className="btn delete"
                    aria-label={`Excluir setor ${s.nome}`}
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
      <div
        className={`modal-overlay ${isModalOpen ? "open" : ""}`}
        onClick={() => setIsModalOpen(false)}
      >
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3 id="modal-title">Adicionar setor</h3>
            <button
              type="button"
              className="close-button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <form className="employee-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Nome
                <input
                  name="nome"
                  value={formValues.nome}
                  onChange={handleChange}
                  type="text"
                  placeholder="Digite o nome"
                />
              </label>
              <label>
                Mínimo funcionários
                <input
                  name="minimoFuncionarios"
                  value={formValues.minimoFuncionarios}
                  onChange={handleChange}
                  type="number"
                  placeholder="Ex: 2"
                />
              </label>
              <label>
                Atividade padrão
                <input
                  name="atividadePadrao"
                  value={formValues.atividadePadrao}
                  onChange={handleChange}
                  type="text"
                  placeholder="Atividade padrão"
                />
              </label>
              <label>
                Cor
                <input
                  name="cor"
                  value={formValues.cor}
                  onChange={handleChange}
                  type="color"
                />
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
    </section>
  );
}
