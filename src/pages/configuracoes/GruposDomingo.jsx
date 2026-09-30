import { useState, useMemo } from "react";
import { useSupabase } from "../../hooks/useSupabase";

export default function GruposDomingo() {
  const {
    data: grupos,
    loading,
    add,
    update,
    remove,
    refetch,
  } = useSupabase("grupo_domingo");

  const [dataInicio, setDataInicio] = useState(
    () => localStorage.getItem("data_inicio_domingo") || "",
  );
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [nome, setNome] = useState("");

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [draggedList, setDraggedList] = useState([]);

  const localGrupos = useMemo(() => {
    if (!grupos) return [];
    return [...grupos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [grupos]);

  const gruposVisiveis = draggedList.length > 0 ? draggedList : localGrupos;

  const handleSaveDate = () => {
    localStorage.setItem("data_inicio_domingo", dataInicio);
    alert("Data inicial salva com sucesso!");
  };

  const handleOpenModal = (grupo = null) => {
    setEditGroup(grupo);
    setNome(grupo ? grupo.nome : "");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditGroup(null);
    setNome("");
    setShowModal(false);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (editGroup) {
      await update(editGroup.id, { nome });
    } else {
      // New group gets max ordem + 1
      const maxOrdem = gruposVisiveis.reduce(
        (max, g) => Math.max(max, g.ordem || 0),
        0,
      );
      await add({ nome, ordem: maxOrdem + 1 });
    }
    handleCloseModal();
    refetch();
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja remover este grupo?")) {
      await remove(id);
      refetch();
    }
  };

  // Drag and drop logic
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;

    const oldIndex = gruposVisiveis.findIndex(
      (g) => String(g.id) === String(draggedItemId),
    );
    const newIndex = gruposVisiveis.findIndex(
      (g) => String(g.id) === String(targetId),
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const newList = [...gruposVisiveis];
    const [movedItem] = newList.splice(oldIndex, 1);
    newList.splice(newIndex, 0, movedItem);

    // Optimistic UI update
    setDraggedList(newList);

    // Update all ordens in database
    try {
      for (let i = 0; i < newList.length; i++) {
        await update(newList[i].id, { ordem: i + 1 });
      }
      setDraggedList([]);
      refetch();
    } catch (err) {
      console.error("Failed to reorder", err);
      alert("Erro ao reordenar.");
    }

    setDraggedItemId(null);
  };

  if (loading) return <div>Carregando grupos de domingo...</div>;

  return (
    <div className="config-page">
      <div className="config-card">
        <div className="config-header">
          <h2>Data Inicial (Sistema)</h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}
          >
            O sistema usará esta data para começar a intercalar os grupos de
            domingo, respeitando a ordem definida abaixo.
          </p>
        </div>
        <div
          className="search-box"
          style={{ maxWidth: "320px", display: "flex", gap: "10px" }}
        >
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <button type="button" onClick={handleSaveDate}>
            Salvar Data
          </button>
        </div>
      </div>

      <div className="config-card table-panel">
        <div className="panel-header">
          <h2>Grupos de Domingo</h2>
          <button
            type="button"
            className="add-button"
            onClick={() => handleOpenModal()}
          >
            + Novo Grupo
          </button>
        </div>

        <div className="table-wrapper">
          <table className="flow-grid-table">
            <thead>
              <tr>
                <th style={{ width: "60px", textAlign: "center" }}>Arrastar</th>
                <th style={{ textAlign: "left" }}>Nome do Grupo</th>
                <th style={{ width: "80px", textAlign: "center" }}>Ordem</th>
                <th style={{ width: "160px", textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gruposVisiveis.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Nenhum grupo cadastrado.
                  </td>
                </tr>
              ) : (
                gruposVisiveis.map((grupo, index) => (
                  <tr
                    key={grupo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, grupo.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, grupo.id)}
                    style={{
                      cursor: "grab",
                      opacity: draggedItemId === grupo.id ? 0.4 : 1,
                      backgroundColor:
                        draggedItemId === grupo.id
                          ? "var(--surface-soft)"
                          : "inherit",
                    }}
                  >
                    <td style={{ textAlign: "center", cursor: "grab" }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="var(--text-muted)"
                        style={{ pointerEvents: "none" }}
                      >
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm12-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                      </svg>
                    </td>
                    <td style={{ textAlign: "left", fontWeight: "600" }}>
                      {grupo.nome}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "800",
                        color: "var(--orange-500)",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td>
                      <div
                        className="actions"
                        style={{ justifyContent: "center" }}
                      >
                        <button
                          className="btn edit"
                          onClick={() => handleOpenModal(grupo)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn delete"
                          onClick={() => handleDelete(grupo.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      <div
        className={`modal-overlay ${showModal ? "open" : ""}`}
        onClick={handleCloseModal}
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editGroup ? "Editar Grupo" : "Novo Grupo"}</h3>
            <button className="close-button" onClick={handleCloseModal}>
              &times;
            </button>
          </div>
          <form className="employee-form" onSubmit={handleSaveGroup}>
            <label>
              Nome do Grupo:
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Grupo A"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseModal}
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
