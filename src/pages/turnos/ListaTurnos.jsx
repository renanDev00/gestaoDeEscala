import { useState } from "react";
import turnos from "../../models/turnos";
import { initializeStorage, saveToStorage } from "../../utils/storage";

export default function ListaTurnos() {
  const [turnosList, setTurnosList] = useState(() =>
    initializeStorage("turnos", turnos),
  );
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
      horarioInicio: turno.horarioInicio,
      horarioFim: turno.horarioFim,
      intervaloInicio: turno.intervaloInicio,
      intervaloFim: turno.intervaloFim,
      descansoInicio: turno.descansoinicio || "",
      descansoFim: turno.descansoFim || "",
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      nome: formValues.nome.trim(),
      horarioInicio: formValues.horarioInicio,
      horarioFim: formValues.horarioFim,
      intervaloInicio: formValues.intervaloInicio,
      intervaloFim: formValues.intervaloFim,
      descansoinicio: formValues.descansoInicio,
      descansoFim: formValues.descansoFim,
    };

    if (!payload.nome || !payload.horarioInicio || !payload.horarioFim) {
      return;
    }

    let newList;
    if (editingId !== null) {
      newList = turnosList.map((item) =>
        item.id === editingId ? { ...item, ...payload } : item,
      );
    } else {
      const nextId =
        turnosList.reduce((max, turno) => Math.max(max, turno.id), 0) + 1;
      newList = [...turnosList, { id: nextId, ...payload }];
    }

    setTurnosList(newList);
    saveToStorage("turnos", newList);
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

  const handleDelete = (turnoId) => {
    const newList = turnosList.filter((item) => item.id !== turnoId);
    setTurnosList(newList);
    saveToStorage("turnos", newList);
  };

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
                <td>{t.horarioInicio}</td>
                <td>{t.horarioFim}</td>
                <td>
                  {t.intervaloInicio}-{t.intervaloFim}
                </td>

                <td>
                  {t.descansoInicio || t.descansoinicio || "-"}-
                  {t.descansoFim || "-"}
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
