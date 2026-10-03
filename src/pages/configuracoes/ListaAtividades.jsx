import { useState } from "react";
import { Plus } from "lucide-react";
import { useSupabase } from "../../hooks/useSupabase";
import { supabase } from "../../shared/lib/supabase";

const ACTIVITY_TYPES = {
  variavel: "Variável",
  fixa: "Fixa",
};

export default function ListaAtividades() {
  const {
    data: atividadesList,
    loading: aLoading,
    add,
    update,
    remove,
  } = useSupabase("atividades");
  const { data: setoresList, loading: sLoading } = useSupabase("setores");
  const { data: funcionariosList, loading: fLoading } =
    useSupabase("funcionarios");
  const {
    data: rankingSalvo,
    loading: rLoading,
    refetch: refetchRanking,
  } = useSupabase("atividade_fixa_ranking");

  const [form, setForm] = useState({
    setor_id: "",
    todos_setores: false,
    nome: "",
    descricao: "",
    tipo: "variavel",
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rankingIds, setRankingIds] = useState([]);
  const [desconsideradosIds, setDesconsideradosIds] = useState([]);
  const [draggedFuncionarioId, setDraggedFuncionarioId] = useState(null);
  const [salvandoRanking, setSalvandoRanking] = useState(false);

  const resetForm = () => {
    setForm({
      setor_id: "",
      todos_setores: false,
      nome: "",
      descricao: "",
      tipo: "variavel",
    });
    setEditingId(null);
    setRankingIds([]);
    setDesconsideradosIds([]);
  };

  const getEligibleEmployees = (activityForm) =>
    funcionariosList
      .filter(
        (funcionario) =>
          activityForm.todos_setores ||
          (activityForm.setor_id &&
            String(funcionario.setor_id) === String(activityForm.setor_id)),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));

  const updateRankingCandidates = (activityForm) => {
    const eligibleIds = new Set(
      getEligibleEmployees(activityForm).map((funcionario) =>
        String(funcionario.id),
      ),
    );
    const nextRanking = rankingIds.filter((id) => eligibleIds.has(id));
    const nextExcluded = desconsideradosIds.filter((id) => eligibleIds.has(id));
    const currentIds = new Set([...nextRanking, ...nextExcluded]);
    const newIds = getEligibleEmployees(activityForm)
      .map((funcionario) => String(funcionario.id))
      .filter((id) => !currentIds.has(id));

    setRankingIds([...nextRanking, ...newIds]);
    setDesconsideradosIds(nextExcluded);
  };

  const initializeRanking = (activity, activityForm) => {
    const eligibleIds = new Set(
      getEligibleEmployees(activityForm).map((funcionario) =>
        String(funcionario.id),
      ),
    );
    const records = rankingSalvo
      .filter((record) => String(record.atividade_id) === String(activity?.id))
      .sort((a, b) => a.posicao - b.posicao);
    const ranked = records
      .filter((record) => !record.desconsiderado)
      .map((record) => String(record.funcionario_id))
      .filter((id) => eligibleIds.has(id));
    const excluded = records
      .filter((record) => record.desconsiderado)
      .map((record) => String(record.funcionario_id))
      .filter((id) => eligibleIds.has(id));
    const knownIds = new Set([...ranked, ...excluded]);
    const newIds = getEligibleEmployees(activityForm)
      .map((funcionario) => String(funcionario.id))
      .filter((id) => !knownIds.has(id));

    setRankingIds([...ranked, ...newIds]);
    setDesconsideradosIds(excluded);
  };

  const openModal = (atividade = null) => {
    if (atividade) {
      setEditingId(atividade.id);
      const activityForm = {
        setor_id: atividade.setor_id ? String(atividade.setor_id) : "",
        todos_setores: Boolean(atividade.todos_setores || !atividade.setor_id),
        nome: atividade.nome || "",
        descricao: atividade.descricao || "",
        tipo: atividade.tipo || "variavel",
      };
      setForm(activityForm);
      initializeRanking(atividade, activityForm);
    } else {
      resetForm();
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const setorSelecionado = form.todos_setores
      ? setoresList.find((setor) => String(setor.id) === form.setor_id) ||
        setoresList[0]
      : setoresList.find((setor) => String(setor.id) === form.setor_id);

    if (!setorSelecionado) {
      alert("Cadastre pelo menos um setor antes de salvar a atividade.");
      return;
    }

    const payload = {
      setor_id: setorSelecionado.id,
      todos_setores: form.todos_setores,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      tipo: form.tipo || "variavel",
    };

    if (!payload.nome) {
      return;
    }

    const saved = editingId
      ? await update(editingId, payload)
      : await add(payload);

    if (!saved) return;

    const rankingSalvoComSucesso = await salvarRanking(
      saved.id,
      payload.tipo === "fixa",
    );
    if (!rankingSalvoComSucesso) return;

    setIsModalOpen(false);
    resetForm();
  };

  const moverFuncionario = (destino, sobreId = null) => {
    if (!draggedFuncionarioId) return;
    const deLista = rankingIds.includes(draggedFuncionarioId)
      ? "ranking"
      : "desconsiderados";
    const paraLista = destino;
    const origem =
      deLista === "ranking" ? [...rankingIds] : [...desconsideradosIds];
    const destinoLista =
      paraLista === "ranking" ? [...rankingIds] : [...desconsideradosIds];
    origem.splice(origem.indexOf(draggedFuncionarioId), 1);

    if (deLista !== paraLista) destinoLista.push(draggedFuncionarioId);
    else {
      const atual = destinoLista.indexOf(draggedFuncionarioId);
      if (atual >= 0) destinoLista.splice(atual, 1);
    }

    if (sobreId && sobreId !== draggedFuncionarioId) {
      const current = destinoLista.indexOf(draggedFuncionarioId);
      if (current >= 0) destinoLista.splice(current, 1);
      const index = destinoLista.indexOf(sobreId);
      destinoLista.splice(
        index < 0 ? destinoLista.length : index,
        0,
        draggedFuncionarioId,
      );
    }

    if (deLista !== paraLista) {
      setRankingIds(paraLista === "ranking" ? destinoLista : origem);
      setDesconsideradosIds(
        paraLista === "desconsiderados" ? destinoLista : origem,
      );
    } else if (paraLista === "ranking") {
      setRankingIds(destinoLista);
    } else {
      setDesconsideradosIds(destinoLista);
    }
    setDraggedFuncionarioId(null);
  };

  const salvarRanking = async (atividadeId, isFixa) => {
    setSalvandoRanking(true);
    const { error: deleteError } = await supabase
      .from("atividade_fixa_ranking")
      .delete()
      .eq("atividade_id", atividadeId);

    if (deleteError) {
      alert(`Erro ao salvar ranking.\n\n${deleteError.message}`);
      setSalvandoRanking(false);
      return false;
    }

    const payload = isFixa
      ? [
          ...rankingIds.map((funcionarioId, index) => ({
            atividade_id: atividadeId,
            funcionario_id: funcionarioId,
            posicao: index + 1,
            desconsiderado: false,
          })),
          ...desconsideradosIds.map((funcionarioId, index) => ({
            atividade_id: atividadeId,
            funcionario_id: funcionarioId,
            posicao: rankingIds.length + index + 1,
            desconsiderado: true,
          })),
        ]
      : [];

    if (payload.length > 0) {
      const { error } = await supabase
        .from("atividade_fixa_ranking")
        .insert(payload);
      if (error) {
        alert(`Erro ao salvar ranking.\n\n${error.message}`);
        setSalvandoRanking(false);
        return false;
      }
    }

    await refetchRanking();
    setSalvandoRanking(false);
    return true;
  };

  const handleDelete = async (atividade) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a atividade "${atividade.nome}"?`,
      )
    ) {
      await remove(atividade.id);
    }
  };

  if (aLoading || sLoading || fLoading || rLoading) {
    return <div style={{ padding: "20px" }}>Carregando atividades...</div>;
  }

  return (
    <>
      <section className="table-panel">
        <div className="panel-header">
          <h2>Atividades</h2>
          <button
            type="button"
            className="add-button"
            onClick={() => openModal()}
          >
            <Plus size={16} aria-hidden="true" />
            Nova atividade
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Setor</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {atividadesList.map((atividade) => (
                <tr key={atividade.id}>
                  <td>
                    {atividade.todos_setores || !atividade.setor_id
                      ? "Todos os setores"
                      : atividade.setor_id
                        ? setoresList.find(
                            (setor) =>
                              String(setor.id) === String(atividade.setor_id),
                          )?.nome || "Setor não encontrado"
                        : "Setor não encontrado"}
                  </td>
                  <td>{atividade.nome}</td>
                  <td>
                    {ACTIVITY_TYPES[atividade.tipo] ||
                      atividade.tipo ||
                      "Variável"}
                  </td>
                  <td>{atividade.descricao || "—"}</td>
                  <td className="actions">
                    <button
                      className="btn edit"
                      aria-label={`Editar ${atividade.nome}`}
                      onClick={() => openModal(atividade)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                      </svg>
                    </button>
                    <button
                      className="btn delete"
                      aria-label={`Excluir ${atividade.nome}`}
                      onClick={() => handleDelete(atividade)}
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
          className="modal-card activity-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atividade-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <h3 id="atividade-modal-title">
              {editingId ? "Editar atividade" : "Nova atividade"}
            </h3>
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
                Setor
                <select
                  value={form.todos_setores ? "__todos__" : form.setor_id}
                  onChange={(e) => {
                    const isTodosSetores = e.target.value === "__todos__";
                    const nextForm = {
                      ...form,
                      setor_id: isTodosSetores ? form.setor_id : e.target.value,
                      todos_setores: isTodosSetores,
                    };
                    setForm(nextForm);
                    updateRankingCandidates(nextForm);
                  }}
                >
                  <option value="__todos__">Todos os setores</option>
                  <option value="">Selecione um setor</option>
                  {setoresList.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Nome
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex: Horas extras"
                  required
                />
              </label>

              <label>
                Tipo
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, tipo: e.target.value }))
                  }
                >
                  <option value="variavel">Variável</option>
                  <option value="fixa">Fixa</option>
                </select>
              </label>

              {form.tipo === "fixa" && (
                <section className="activity-ranking-inline">
                  <div className="activity-ranking-intro">
                    <h4>Funcionários disponíveis para esta atividade</h4>
                    <p>
                      Arraste para ordenar a preferência ou mover para a lista
                      de desconsiderados.
                    </p>
                  </div>
                  <div className="activity-ranking-columns">
                    {[
                      {
                        id: "ranking",
                        title: "Ranking",
                        ids: rankingIds,
                      },
                      {
                        id: "desconsiderados",
                        title: "Desconsiderar",
                        ids: desconsideradosIds,
                      },
                    ].map((lista) => (
                      <section
                        className="activity-ranking-list"
                        key={lista.id}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          moverFuncionario(lista.id);
                        }}
                      >
                        <h4>{lista.title}</h4>
                        <div className="activity-ranking-items">
                          {lista.ids.map((funcionarioId, index) => {
                            const funcionario = funcionariosList.find(
                              (item) => String(item.id) === funcionarioId,
                            );
                            if (!funcionario) return null;
                            return (
                              <div
                                className="activity-ranking-item"
                                key={funcionarioId}
                                draggable
                                onDragStart={(event) => {
                                  setDraggedFuncionarioId(funcionarioId);
                                  event.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  moverFuncionario(lista.id, funcionarioId);
                                }}
                              >
                                <span
                                  className="activity-ranking-grip"
                                  aria-hidden="true"
                                >
                                  ⋮⋮
                                </span>
                                {lista.id === "ranking" && (
                                  <strong>{index + 1}</strong>
                                )}
                                <span>{funcionario.nome}</span>
                              </div>
                            );
                          })}
                          {lista.ids.length === 0 && (
                            <p className="activity-ranking-empty">
                              {form.setor_id || form.todos_setores
                                ? "Arraste funcionários para esta lista."
                                : "Selecione um setor para carregar os funcionários."}
                            </p>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                </section>
              )}

              <label style={{ gridColumn: "1 / -1" }}>
                Descrição
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Descreva a atividade..."
                  rows="4"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={salvandoRanking}
              >
                {salvandoRanking ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
