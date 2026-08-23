import { useState } from "react";
import funcionarios from "../../models/funcionarios";
import turnos from "../../models/turnos";
import setores from "../../models/setores";
import grupoDom from "../../models/grupoDom";

const diasSemana = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

function ListaFuncionarios() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionariosList, setFuncionariosList] = useState(funcionarios);
  const [funcionarioForm, setFuncionarioForm] = useState({
    nome: "",
    folga: "",
    setor: "",
    turno: "",
    grupoDom: "",
  });
  const [funcionarioEditando, setFuncionarioEditando] = useState(null);

  const resetFuncionarioForm = () => {
    setFuncionarioForm({
      nome: "",
      folga: "",
      setor: "",
      turno: "",
      grupoDom: "",
    });
    setFuncionarioEditando(null);
  };

  const openFuncionarioModal = (funcionario = null) => {
    if (funcionario) {
      setFuncionarioEditando(funcionario.nome);
      setFuncionarioForm({
        nome: funcionario.nome,
        folga: funcionario.folga,
        setor: String(funcionario.setor),
        turno: String(funcionario.turno),
        grupoDom: String(funcionario.grupoDom),
      });
    } else {
      resetFuncionarioForm();
    }

    setIsModalOpen(true);
  };

  const handleFuncionarioSubmit = (e) => {
    e.preventDefault();

    const payload = {
      nome: funcionarioForm.nome.trim(),
      folga: Number(funcionarioForm.folga),
      setor: Number(funcionarioForm.setor),
      turno: Number(funcionarioForm.turno),
      grupoDom: Number(funcionarioForm.grupoDom),
    };

    if (!payload.nome || !payload.folga || !payload.setor || !payload.turno) {
      return;
    }

    if (funcionarioEditando) {
      setFuncionariosList((prev) =>
        prev.map((item) =>
          item.nome === funcionarioEditando ? { ...item, ...payload } : item,
        ),
      );
    } else {
      setFuncionariosList((prev) => [...prev, payload]);
    }

    setIsModalOpen(false);
    resetFuncionarioForm();
  };

  const handleDeleteFuncionario = (funcionario) => {
    setFuncionariosList((prev) =>
      prev.filter((item) => item.nome !== funcionario.nome),
    );
  };

  return (
    <>
      <section className="table-panel">
        <div className="panel-header">
          <h2>Lista de funcionários</h2>
          <div className="search-box">
            <input type="text" placeholder="Pesquisar funcionário" />
          </div>
          <button
            type="button"
            className="add-button"
            onClick={() => openFuncionarioModal()}
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
              {funcionariosList.map((funcionario) => (
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
                  <td>
                    {diasSemana[funcionario.folga] || "Dia não encontrado"}
                  </td>
                  <td>{grupoDom[funcionario.grupoDom - 1]?.nome || "-"}</td>
                  <td className="actions">
                    <button
                      className="btn edit"
                      aria-label={`Editar ${funcionario.nome}`}
                      onClick={() => openFuncionarioModal(funcionario)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                      </svg>
                    </button>
                    <button
                      className="btn delete"
                      aria-label={`Excluir ${funcionario.nome}`}
                      onClick={() => handleDeleteFuncionario(funcionario)}
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

          <form className="employee-form" onSubmit={handleFuncionarioSubmit}>
            <div className="form-grid">
              <label>
                Nome
                <input
                  type="text"
                  value={funcionarioForm.nome}
                  onChange={(e) =>
                    setFuncionarioForm((prev) => ({
                      ...prev,
                      nome: e.target.value,
                    }))
                  }
                  placeholder="Digite o nome"
                />
              </label>
              <label>
                Folga
                <select
                  value={funcionarioForm.folga}
                  onChange={(e) =>
                    setFuncionarioForm((prev) => ({
                      ...prev,
                      folga: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecione o dia</option>
                  {Object.entries(diasSemana).map(([num, dia]) => (
                    <option key={num} value={num}>
                      {dia}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Setor
                <select
                  value={funcionarioForm.setor}
                  onChange={(e) =>
                    setFuncionarioForm((prev) => ({
                      ...prev,
                      setor: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecione o setor</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Turno
                <select
                  value={funcionarioForm.turno}
                  onChange={(e) =>
                    setFuncionarioForm((prev) => ({
                      ...prev,
                      turno: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecione o turno</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Grupo Dom.
                <select
                  value={funcionarioForm.grupoDom}
                  onChange={(e) =>
                    setFuncionarioForm((prev) => ({
                      ...prev,
                      grupoDom: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecione o grupo</option>
                  {grupoDom.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetFuncionarioForm();
                }}
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
    </>
  );
}

export default ListaFuncionarios;
