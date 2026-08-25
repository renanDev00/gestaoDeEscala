import { useState } from "react";
import { useSupabase } from "../../hooks/useSupabase";

export default function ListaTurnos() {
  const { data: turnosList, loading, add, update, remove } = useSupabase("turnos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    nome: "",
    horarioInicio: "",
    horarioFim: "",
    intervaloInicio: "",
    intervaloFim: "",
    descansoInicio: "",
    descansoFim: "",
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormValues({
      nome: "",
      horarioInicio: "",
      horarioFim: "",
      intervaloInicio: "",
      intervaloFim: "",
      descansoInicio: "",
      descansoFim: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (turno) => {
    setEditingId(turno.id);
    setFormValues({
      nome: turno.nome,
      horarioInicio: turno.horario_entrada || "",
      horarioFim: turno.horario_saida || "",
      intervaloInicio: turno.inicio_intervalo || "",
      intervaloFim: turno.fim_intervalo || "",
      descansoInicio: turno.inicio_descanso || "",
      descansoFim: turno.fim_descanso || "",
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nome: formValues.nome.trim(),
      horario_entrada: formValues.horarioInicio || null,
      horario_saida: formValues.horarioFim || null,
      inicio_intervalo: formValues.intervaloInicio || null,
      fim_intervalo: formValues.intervaloFim || null,
      inicio_descanso: formValues.descansoInicio || null,
      fim_descanso: formValues.descansoFim || null,
    };

    if (!payload.nome || !payload.horario_entrada || !payload.horario_saida) {
      return;
    }

    if (editingId !== null) {
      await update(editingId, payload);
    } else {
      await add(payload);
    }

    setIsModalOpen(false);
    setFormValues({
      nome: "",
      horarioInicio: "",
      horarioFim: "",
      intervaloInicio: "",
      intervaloFim: "",
      descansoInicio: "",
      descansoFim: "",
    });
    setEditingId(null);
  };

  const handleDelete = async (turnoId) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      await remove(turnoId);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Carregando turnos...</div>;

  return (
    <section className="table-panel">
      <div className="panel-header">
        <h2>Lista de turnos</h2>
        <div className="search-box">
          <input type="text" placeholder="Pesquisar turno" />
        </div>
        <button type="button" className="add-button" onClick={openAddModal}>
          + Adicionar
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Intervalo</th>
              <th>Descanso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {turnosList.map((t) => (
              <tr key={t.id}>
                <td>{t.nome}</td>
                <td>{t.horario_entrada?.substring(0, 5)}</td>
                <td>{t.horario_saida?.substring(0, 5)}</td>
                <td>
                  {t.inicio_intervalo ? t.inicio_intervalo.substring(0, 5) : ""}-{t.fim_intervalo ? t.fim_intervalo.substring(0, 5) : ""}
                </td>

                <td>
                  {t.inicio_descanso ? t.inicio_descanso.substring(0, 5) : "-"}-
                  {t.fim_descanso ? t.fim_descanso.substring(0, 5) : "-"}
                </td>

                <td className="actions">
                  <button
                    className="btn edit"
                    aria-label={`Editar turno ${t.nome}`}
                    onClick={() => openEditModal(t)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                    </svg>
                  </button>
                  <button
                    className="btn delete"
                    aria-label={`Excluir turno ${t.nome}`}
                    onClick={() => handleDelete(t.id)}
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
            <h3 id="modal-title">Adicionar turno</h3>
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
                  placeholder="Nome do turno"
                />
              </label>
              <label>
                Horário Início
                <input
                  name="horarioInicio"
                  value={formValues.horarioInicio}
                  onChange={handleChange}
                  type="time"
                />
              </label>
              <label>
                Horário Fim
                <input
                  name="horarioFim"
                  value={formValues.horarioFim}
                  onChange={handleChange}
                  type="time"
                />
              </label>
              <label>
                Intervalo Início
                <input
                  name="intervaloInicio"
                  value={formValues.intervaloInicio}
                  onChange={handleChange}
                  type="time"
                />
              </label>
              <label>
                Intervalo Fim
                <input
                  name="intervaloFim"
                  value={formValues.intervaloFim}
                  onChange={handleChange}
                  type="time"
                />
              </label>
              <label>
                Descanso Início
                <input
                  name="descansoInicio"
                  value={formValues.descansoInicio}
                  onChange={handleChange}
                  type="time"
                />
              </label>
              <label>
                Descanso Fim
                <input
                  name="descansoFim"
                  value={formValues.descansoFim}
                  onChange={handleChange}
                  type="time"
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
