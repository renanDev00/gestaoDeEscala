import { useState } from "react";
import { useSupabase } from "../../hooks/useSupabase";
import { supabase } from "../../shared/lib/supabase";

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
  const {
    data: funcionariosList,
    loading: fLoading,
    add,
    update,
    remove,
  } = useSupabase("funcionarios");
  const { data: turnosList, loading: tLoading } = useSupabase("turnos");
  const { data: setoresList, loading: sLoading } = useSupabase("setores");
  const { data: grupoDomList, loading: gLoading } =
    useSupabase("grupo_domingo");
  const { data: atividadesList, loading: aLoading } = useSupabase("atividades");
  const {
    data: funcionarioAtividadesList,
    loading: faLoading,
    refetch: refetchFuncionarioAtividades,
  } = useSupabase("funcionarios_atividades");
  const [funcionarioForm, setFuncionarioForm] = useState({
    nome: "",
    folga: "",
    setor: "",
    turno: "",
    grupoDom: "",
    atividades: [],
  });
  const [funcionarioEditando, setFuncionarioEditando] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAtividadeModalOpen, setIsAtividadeModalOpen] = useState(false);
  const [atividadesEmEdicao, setAtividadesEmEdicao] = useState([]);

  const resetFuncionarioForm = () => {
    setFuncionarioForm({
      nome: "",
      folga: "",
      setor: "",
      turno: "",
      grupoDom: "",
      atividades: [],
    });
    setFuncionarioEditando(null);
  };

  const openFuncionarioModal = (funcionario = null) => {
    if (funcionario) {
      setFuncionarioEditando(funcionario.id);
      const atividadesVinculadas = funcionarioAtividadesList
        .filter(
          (vinculo) =>
            String(vinculo.funcionario_id) === String(funcionario.id),
        )
        .map((vinculo) => String(vinculo.atividade_id));
      setFuncionarioForm({
        nome: funcionario.nome,
        folga: String(funcionario.dia_folga || ""),
        setor: String(funcionario.setor_id || ""),
        turno: String(funcionario.turno_id || ""),
        grupoDom: String(funcionario.grupo_domingo_id || ""),
        atividades:
          atividadesVinculadas.length > 0
            ? atividadesVinculadas
            : funcionario.atividade_id
              ? [String(funcionario.atividade_id)]
              : [],
      });
    } else {
      resetFuncionarioForm();
    }

    setIsModalOpen(true);
  };

  const atividadesDoFuncionario = (funcionario) => {
    const vinculos = funcionarioAtividadesList
      .filter(
        (vinculo) => String(vinculo.funcionario_id) === String(funcionario.id),
      )
      .map((vinculo) => String(vinculo.atividade_id));
    const ids =
      vinculos.length > 0
        ? vinculos
        : funcionario.atividade_id
          ? [String(funcionario.atividade_id)]
          : [];

    return ids
      .map((id) =>
        atividadesList.find((atividade) => String(atividade.id) === id),
      )
      .filter(Boolean);
  };

  const atividadesDisponiveis = atividadesList.filter(
    (atividade) =>
      atividade.todos_setores ||
      !atividade.setor_id ||
      String(atividade.setor_id) === funcionarioForm.setor ||
      funcionarioForm.atividades.includes(String(atividade.id)),
  );

  const salvarVinculosAtividades = async (funcionarioId, atividadeIds) => {
    const { data: vinculosAtuais, error: erroConsulta } = await supabase
      .from("funcionarios_atividades")
      .select("atividade_id")
      .eq("funcionario_id", funcionarioId);

    if (erroConsulta) {
      alert(
        `Erro ao carregar vínculos de atividades.\n\n${erroConsulta.message}`,
      );
      return false;
    }

    const selecionados = new Set(atividadeIds);
    const atuais = vinculosAtuais || [];
    const novos = atividadesList
      .filter(
        (atividade) =>
          selecionados.has(String(atividade.id)) &&
          !atuais.some(
            (vinculo) => String(vinculo.atividade_id) === String(atividade.id),
          ),
      )
      .map((atividade) => ({
        funcionario_id: funcionarioId,
        atividade_id: atividade.id,
      }));

    if (novos.length > 0) {
      const { error } = await supabase
        .from("funcionarios_atividades")
        .insert(novos);
      if (error) {
        alert(`Erro ao vincular atividades.\n\n${error.message}`);
        return false;
      }
    }

    const removidos = atuais.filter(
      (vinculo) => !selecionados.has(String(vinculo.atividade_id)),
    );
    for (const vinculo of removidos) {
      const { error } = await supabase
        .from("funcionarios_atividades")
        .delete()
        .eq("funcionario_id", funcionarioId)
        .eq("atividade_id", vinculo.atividade_id);
      if (error) {
        alert(`Erro ao remover um vínculo de atividade.\n\n${error.message}`);
        return false;
      }
    }

    await refetchFuncionarioAtividades();
    return true;
  };

  const handleFuncionarioSubmit = async (e) => {
    e.preventDefault();

    const atividadesSelecionadas = atividadesList.filter((atividade) =>
      funcionarioForm.atividades.includes(String(atividade.id)),
    );

    if (atividadesSelecionadas.length !== funcionarioForm.atividades.length) {
      alert(
        "Uma ou mais atividades selecionadas não estão disponíveis. Atualize a página e tente novamente.",
      );
      return;
    }

    const atividadeIncompativel = atividadesSelecionadas.find(
      (atividade) =>
        atividade.setor_id &&
        !atividade.todos_setores &&
        String(atividade.setor_id) !== funcionarioForm.setor,
    );
    if (atividadeIncompativel) {
      alert(
        `A atividade "${atividadeIncompativel.nome}" não pertence ao setor deste funcionário.`,
      );
      return;
    }

    const payload = {
      nome: funcionarioForm.nome.trim(),
      dia_folga: funcionarioForm.folga || null,
      setor_id: funcionarioForm.setor || null,
      turno_id: funcionarioForm.turno || null,
      grupo_domingo_id: funcionarioForm.grupoDom || null,
      atividade_id: atividadesSelecionadas[0]?.id ?? null,
    };

    if (
      !payload.nome ||
      !payload.dia_folga ||
      !payload.setor_id ||
      !payload.turno_id
    ) {
      return;
    }

    const saved = funcionarioEditando
      ? await update(funcionarioEditando, payload)
      : await add(payload);

    if (!saved) return;

    if (!funcionarioEditando) setFuncionarioEditando(saved.id);

    const linksSalvos = await salvarVinculosAtividades(
      saved.id,
      funcionarioForm.atividades,
    );
    if (!linksSalvos) return;

    setIsModalOpen(false);
    resetFuncionarioForm();
  };

  const handleDeleteFuncionario = async (funcionario) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      await remove(funcionario.id);
    }
  };

  if (fLoading || tLoading || sLoading || gLoading || aLoading || faLoading) {
    return <div style={{ padding: "20px" }}>Carregando dados...</div>;
  }

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
                <th>Atividade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {funcionariosList.map((funcionario) => (
                <tr key={funcionario.id}>
                  <td>{funcionario.nome}</td>
                  <td>
                    {setoresList.find((s) => s.id === funcionario.setor_id)
                      ?.nome || "Setor não encontrado"}
                  </td>
                  <td>
                    {turnosList.find((t) => t.id === funcionario.turno_id)
                      ?.nome || "Turno não encontrado"}
                  </td>
                  <td>
                    {diasSemana[funcionario.dia_folga] || "Dia não encontrado"}
                  </td>
                  <td>
                    {grupoDomList.find(
                      (g) => g.id === funcionario.grupo_domingo_id,
                    )?.nome || "-"}
                  </td>
                  <td>
                    {atividadesDoFuncionario(funcionario)
                      .map((atividade) => atividade.nome)
                      .join(", ") || "-"}
                  </td>
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
                  onChange={(e) => {
                    const setorId = e.target.value;
                    const atividadeCompativel =
                      funcionarioForm.atividades.filter((atividadeId) => {
                        const atividade = atividadesList.find(
                          (item) => String(item.id) === atividadeId,
                        );
                        return (
                          atividade?.todos_setores ||
                          !atividade?.setor_id ||
                          String(atividade.setor_id) === setorId
                        );
                      });

                    setFuncionarioForm((prev) => ({
                      ...prev,
                      setor: setorId,
                      atividades: atividadeCompativel,
                    }));
                  }}
                >
                  <option value="">Selecione o setor</option>
                  {setoresList.map((setor) => (
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
                  {turnosList.map((turno) => (
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
                  {grupoDomList.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </label>

              <div className="activity-link-field">
                <span>Atividades vinculadas</span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setAtividadesEmEdicao(funcionarioForm.atividades);
                    setIsAtividadeModalOpen(true);
                  }}
                >
                  Vincular atividade
                </button>
                <small>
                  {funcionarioForm.atividades.length === 0
                    ? "Nenhuma atividade vinculada"
                    : funcionarioForm.atividades
                        .map(
                          (atividadeId) =>
                            atividadesList.find(
                              (atividade) =>
                                String(atividade.id) === atividadeId,
                            )?.nome,
                        )
                        .filter(Boolean)
                        .join(", ")}
                </small>
              </div>
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

      <div
        className={`modal-overlay ${isAtividadeModalOpen ? "open" : ""}`}
        style={{ zIndex: 60 }}
        onClick={() => setIsAtividadeModalOpen(false)}
      >
        <div
          className="modal-card activity-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-picker-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <h3 id="activity-picker-title">Vincular atividade</h3>
            <button
              type="button"
              className="close-button"
              onClick={() => setIsAtividadeModalOpen(false)}
              aria-label="Fechar seleção de atividades"
            >
              ×
            </button>
          </div>

          <div className="activity-picker-list">
            {atividadesDisponiveis.length === 0 ? (
              <p>Nenhuma atividade disponível para o setor selecionado.</p>
            ) : (
              atividadesDisponiveis.map((atividade) => {
                const atividadeId = String(atividade.id);
                return (
                  <label className="activity-picker-option" key={atividade.id}>
                    <input
                      type="checkbox"
                      checked={atividadesEmEdicao.includes(atividadeId)}
                      onChange={(event) =>
                        setAtividadesEmEdicao((prev) =>
                          event.target.checked
                            ? [...prev, atividadeId]
                            : prev.filter((id) => id !== atividadeId),
                        )
                      }
                    />
                    <span>
                      <strong>{atividade.nome}</strong>
                      <small>
                        {atividade.todos_setores || !atividade.setor_id
                          ? "Todos os setores"
                          : setoresList.find(
                              (setor) =>
                                String(setor.id) === String(atividade.setor_id),
                            )?.nome || "Setor"}
                        {atividade.descricao ? ` · ${atividade.descricao}` : ""}
                      </small>
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsAtividadeModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setFuncionarioForm((prev) => ({
                  ...prev,
                  atividades: atividadesEmEdicao,
                }));
                setIsAtividadeModalOpen(false);
              }}
            >
              Confirmar seleção ({atividadesEmEdicao.length})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ListaFuncionarios;
