import { useMemo, useState } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";
import { useSupabase } from "../../hooks/useSupabase";
import { supabase } from "../../lib/supabase";
import { resolverDia } from "../../utils/domingoUtils";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const percentual = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function mesAtualLocal() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function formatarMes(mes) {
  if (!mes) return mes;
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, numeroMes - 1, 1, 12));
}

function numeroValido(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function classePercentual(valor) {
  if (valor >= 100) return "campaign-percent campaign-percent--complete";
  if (valor >= 70) return "campaign-percent campaign-percent--near";
  return "campaign-percent campaign-percent--low";
}

export default function CampanhaFtwRelatorio() {
  const mesAtual = mesAtualLocal();
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [formulario, setFormulario] = useState({
    mes: mesAtual,
    meta_pares: "",
    meta_valor: "",
  });
  const [campanhaEmEdicao, setCampanhaEmEdicao] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [rascunhos, setRascunhos] = useState({});
  const [salvando, setSalvando] = useState(false);

  const { data: funcionarios, loading: carregandoFuncionarios } =
    useSupabase("funcionarios");
  const { data: setores, loading: carregandoSetores } = useSupabase("setores");
  const {
    data: campanhas,
    loading: carregandoCampanhas,
    add,
    update,
    refetch: recarregarCampanhas,
  } = useSupabase("campanhas_ftw");
  const {
    data: resultados,
    loading: carregandoResultados,
    refetch: recarregarResultados,
  } = useSupabase("campanhas_ftw_resultados");
  const { data: ausencias, loading: carregandoAusencias } =
    useSupabase("ausencias");
  const { data: mudancas, loading: carregandoMudancas } = useSupabase(
    "mudancas_turno_setor",
  );
  const { data: trocas, loading: carregandoTrocas } =
    useSupabase("trocas_folga");
  const { data: gruposDomingo, loading: carregandoGrupos } =
    useSupabase("grupo_domingo");

  const setorFtw = setores.find(
    (setor) => setor.nome?.trim().toLocaleLowerCase("pt-BR") === "ftw",
  );
  const funcionariosFtw = useMemo(
    () =>
      funcionarios
        .filter(
          (funcionario) =>
            setorFtw && String(funcionario.setor_id) === String(setorFtw.id),
        )
        .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")),
    [funcionarios, setorFtw],
  );
  const campanha = campanhas.find((item) => item.mes === mesSelecionado);
  const resultadosDaCampanha = useMemo(
    () =>
      resultados.filter(
        (item) => campanha && String(item.campanha_id) === String(campanha.id),
      ),
    [campanha, resultados],
  );
  const dirty = useMemo(() => {
    if (!modoEdicao || !campanha) return false;
    return funcionariosFtw.some((funcionario) => {
      const original = resultadosDaCampanha.find(
        (item) => String(item.funcionario_id) === String(funcionario.id),
      );
      const rascunho = rascunhos[String(funcionario.id)];
      return (
        rascunho &&
        (rascunho.total_pares.trim() === "" ||
          rascunho.total_valor.trim() === "" ||
          numeroValido(rascunho.total_pares) !==
            Number(original?.total_pares || 0) ||
          numeroValido(rascunho.total_valor) !==
            Number(original?.total_valor || 0))
      );
    });
  }, [campanha, funcionariosFtw, modoEdicao, rascunhos, resultadosDaCampanha]);

  const linhas = useMemo(() => {
    if (!campanha) return [];
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const hoje = new Date();
    const hojeMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    const mesNoPassado = mesSelecionado < hojeMes;
    const inicioDia = mesSelecionado > hojeMes ? 1 : hoje.getDate();
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const contexto = {
      ausencias,
      mudancas,
      trocas,
      grupoDomList: gruposDomingo,
      dataInicioGlobal: localStorage.getItem("data_inicio_domingo"),
    };

    return funcionariosFtw.map((funcionario) => {
      const resultado = resultadosDaCampanha.find(
        (item) => String(item.funcionario_id) === String(funcionario.id),
      );
      const rascunho = rascunhos[String(funcionario.id)];
      const totalPares = numeroValido(
        rascunho?.total_pares ?? resultado?.total_pares ?? 0,
      );
      const totalValor = numeroValido(
        rascunho?.total_valor ?? resultado?.total_valor ?? 0,
      );
      let diasRestantes = 0;
      if (!mesNoPassado) {
        for (let dia = inicioDia; dia <= ultimoDia; dia += 1) {
          const data = new Date(ano, mes - 1, dia, 12);
          const resolucao = resolverDia(funcionario, data, contexto);
          if (!resolucao.folga && !resolucao.ausente) diasRestantes += 1;
        }
      }
      const paresRestantes = Math.max(
        Number(campanha.meta_pares) - totalPares,
        0,
      );
      return {
        funcionario,
        totalPares,
        totalValor,
        percentualPares: (totalPares / Number(campanha.meta_pares)) * 100,
        percentualValor: (totalValor / Number(campanha.meta_valor)) * 100,
        paresRestantes,
        diasRestantes,
        mediaDiaria: diasRestantes ? paresRestantes / diasRestantes : null,
      };
    });
  }, [
    ausencias,
    campanha,
    funcionariosFtw,
    gruposDomingo,
    mesSelecionado,
    mudancas,
    rascunhos,
    resultadosDaCampanha,
    trocas,
  ]);

  const carregando =
    carregandoFuncionarios ||
    carregandoSetores ||
    carregandoCampanhas ||
    carregandoResultados ||
    carregandoAusencias ||
    carregandoMudancas ||
    carregandoTrocas ||
    carregandoGrupos;

  const abrirCadastro = () => {
    setFormulario({ mes: mesSelecionado, meta_pares: "", meta_valor: "" });
    setCampanhaEmEdicao(null);
    setFormularioAberto(true);
  };

  const carregarCampanhaExistente = () => {
    const existente = campanhas.find((item) => item.mes === formulario.mes);
    if (!existente) return;
    setCampanhaEmEdicao(existente.id);
    setFormulario({
      mes: existente.mes,
      meta_pares: String(existente.meta_pares),
      meta_valor: String(existente.meta_valor),
    });
  };

  const salvarCampanha = async (event) => {
    event.preventDefault();
    const pares = Number(formulario.meta_pares);
    const valor = Number(formulario.meta_valor);
    if (
      !formulario.mes ||
      !formulario.meta_pares ||
      !formulario.meta_valor ||
      !Number.isInteger(pares) ||
      pares <= 0 ||
      !Number.isFinite(valor) ||
      valor <= 0
    ) {
      window.alert(
        "Preencha todos os campos com metas maiores que zero. A meta de pares deve ser inteira.",
      );
      return;
    }
    const existente = campanhas.find((item) => item.mes === formulario.mes);
    if (existente && String(existente.id) !== String(campanhaEmEdicao)) {
      window.alert(
        "Já existe uma campanha cadastrada para este mês. Você pode editar a campanha existente.",
      );
      return;
    }
    const payload = {
      mes: formulario.mes,
      meta_pares: pares,
      meta_valor: valor,
    };
    const salvo = campanhaEmEdicao
      ? await update(campanhaEmEdicao, payload)
      : await add(payload);
    if (!salvo) return;
    await recarregarCampanhas();
    setMesSelecionado(formulario.mes);
    setFormularioAberto(false);
  };

  const iniciarEdicao = () => {
    setRascunhos(
      Object.fromEntries(
        linhas.map((linha) => [
          String(linha.funcionario.id),
          {
            total_pares: String(linha.totalPares),
            total_valor: String(linha.totalValor),
          },
        ]),
      ),
    );
    setModoEdicao(true);
  };

  const cancelarEdicao = () => {
    setRascunhos({});
    setModoEdicao(false);
  };

  const alterarMes = (novoMes) => {
    if (
      dirty &&
      !window.confirm(
        "Deseja trocar de mês? As alterações não salvas serão descartadas.",
      )
    )
      return;
    setMesSelecionado(novoMes);
    if (modoEdicao) cancelarEdicao();
  };

  const salvarResultados = async () => {
    if (!campanha || salvando) return;
    if (
      funcionariosFtw.some((funcionario) => {
        const rascunho = rascunhos[String(funcionario.id)];
        return (
          !rascunho ||
          rascunho.total_pares.trim() === "" ||
          rascunho.total_valor.trim() === "" ||
          !Number.isFinite(Number(rascunho.total_pares)) ||
          !Number.isFinite(Number(rascunho.total_valor))
        );
      })
    ) {
      window.alert("Preencha todos os totais com valores numéricos válidos.");
      return;
    }
    const alterados = linhas.filter((linha) => {
      const original = resultadosDaCampanha.find(
        (item) => String(item.funcionario_id) === String(linha.funcionario.id),
      );
      return (
        linha.totalPares !== Number(original?.total_pares || 0) ||
        linha.totalValor !== Number(original?.total_valor || 0)
      );
    });
    if (
      alterados.some(
        (linha) =>
          !Number.isInteger(linha.totalPares) ||
          linha.totalPares < 0 ||
          linha.totalValor < 0,
      )
    ) {
      window.alert(
        "Os pares devem ser inteiros e os valores não podem ser negativos.",
      );
      return;
    }
    setSalvando(true);
    if (alterados.length > 0) {
      const payload = alterados.map((linha) => ({
        campanha_id: campanha.id,
        funcionario_id: linha.funcionario.id,
        total_pares: linha.totalPares,
        total_valor: Number(linha.totalValor.toFixed(2)),
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("campanhas_ftw_resultados")
        .upsert(payload, { onConflict: "campanha_id,funcionario_id" });
      if (error) {
        window.alert(`Erro ao salvar no banco de dados.\n\n${error.message}`);
        setSalvando(false);
        return;
      }
      await recarregarResultados();
    }
    setRascunhos({});
    setModoEdicao(false);
    setSalvando(false);
  };

  if (carregando)
    return <div className="campaign-loading">Carregando dados...</div>;

  const campanhasOrdenadas = [...campanhas].sort((a, b) =>
    b.mes.localeCompare(a.mes),
  );
  const campanhaDoFormulario = campanhas.find(
    (item) => item.mes === formulario.mes,
  );

  return (
    <div className="campaign-report">
      <div className="campaign-controls no-print">
        <label className="campaign-field" htmlFor="campaign-month">
          Mês da campanha
          <select
            id="campaign-month"
            value={mesSelecionado}
            onChange={(event) => alterarMes(event.target.value)}
          >
            {!campanhas.some((item) => item.mes === mesSelecionado) && (
              <option value={mesSelecionado}>
                {formatarMes(mesSelecionado)}
              </option>
            )}
            {campanhasOrdenadas.map((item) => (
              <option key={item.id} value={item.mes}>
                {formatarMes(item.mes)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="campaign-button campaign-button--primary"
          onClick={abrirCadastro}
        >
          <Plus size={16} aria-hidden="true" />
          Cadastrar campanha
        </button>
      </div>

      {formularioAberto && (
        <form className="table-panel campaign-form" onSubmit={salvarCampanha}>
          <div className="panel-header">
            <h2>
              {campanhaEmEdicao ? "Editar campanha" : "Cadastrar campanha"}
            </h2>
            <button
              type="button"
              className="campaign-icon-button"
              aria-label="Fechar formulário"
              onClick={() => setFormularioAberto(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="campaign-form-fields">
            <label className="campaign-field">
              Mês
              <input
                type="month"
                required
                value={formulario.mes}
                onChange={(event) =>
                  setFormulario({ ...formulario, mes: event.target.value })
                }
              />
            </label>
            <label className="campaign-field">
              Meta de pares
              <input
                type="number"
                min="1"
                step="1"
                required
                value={formulario.meta_pares}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    meta_pares: event.target.value,
                  })
                }
              />
            </label>
            <label className="campaign-field">
              Meta de valor (R$)
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formulario.meta_valor}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    meta_valor: event.target.value,
                  })
                }
              />
            </label>
            <div className="campaign-form-actions">
              {campanhaDoFormulario && !campanhaEmEdicao && (
                <button
                  type="button"
                  className="campaign-button"
                  onClick={carregarCampanhaExistente}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar campanha existente
                </button>
              )}
              <button
                type="submit"
                className="campaign-button campaign-button--primary"
              >
                <Save size={16} aria-hidden="true" />
                Salvar campanha
              </button>
            </div>
          </div>
        </form>
      )}

      {!campanha ? (
        <div className="table-panel campaign-empty">
          <h2>Nenhuma campanha cadastrada para este mês</h2>
          <button
            type="button"
            className="campaign-button campaign-button--primary"
            onClick={abrirCadastro}
          >
            <Plus size={16} aria-hidden="true" />
            Cadastrar campanha
          </button>
        </div>
      ) : (
        <section className="table-panel">
          <header className="panel-header campaign-table-header">
            <div>
              <h2>Campanha FTW</h2>
              <span className="campaign-subtitle">
                {formatarMes(campanha.mes)}
              </span>
            </div>
            <div className="campaign-actions no-print">
              {modoEdicao ? (
                <>
                  <button
                    type="button"
                    className="campaign-button campaign-button--primary"
                    onClick={salvarResultados}
                    disabled={salvando}
                  >
                    <Save size={16} aria-hidden="true" />
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    className="campaign-button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="campaign-button"
                  onClick={iniciarEdicao}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar
                </button>
              )}
            </div>
          </header>
          <div className="table-wrapper campaign-table-wrapper">
            <table className="campaign-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Meta de pares</th>
                  <th>Pares vendidos</th>
                  <th>% de pares</th>
                  <th>Média diária necessária</th>
                  <th>Meta de valor</th>
                  <th>Total vendido</th>
                  <th>% de valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.funcionario.id}>
                    <td className="campaign-name">{linha.funcionario.nome}</td>
                    <td>{campanha.meta_pares}</td>
                    <td>
                      {modoEdicao ? (
                        <input
                          className="campaign-number-input"
                          aria-label={`Total de pares de ${linha.funcionario.nome}`}
                          type="number"
                          min="0"
                          step="1"
                          value={
                            rascunhos[String(linha.funcionario.id)]
                              ?.total_pares ?? "0"
                          }
                          onChange={(event) =>
                            setRascunhos((atual) => ({
                              ...atual,
                              [String(linha.funcionario.id)]: {
                                ...atual[String(linha.funcionario.id)],
                                total_pares: event.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        linha.totalPares
                      )}
                    </td>
                    <td>
                      <span className={classePercentual(linha.percentualPares)}>
                        {percentual.format(linha.percentualPares)}%
                      </span>
                    </td>
                    <td>
                      {linha.paresRestantes === 0 ? (
                        <span className="campaign-target-hit">Meta batida</span>
                      ) : linha.diasRestantes === 0 ? (
                        <span title="Sem dias restantes">—</span>
                      ) : (
                        decimal.format(linha.mediaDiaria)
                      )}
                      <small className="campaign-days-left">
                        {linha.diasRestantes}{" "}
                        {linha.diasRestantes === 1
                          ? "dia restante"
                          : "dias restantes"}
                      </small>
                    </td>
                    <td>{moeda.format(Number(campanha.meta_valor))}</td>
                    <td>
                      {modoEdicao ? (
                        <input
                          className="campaign-number-input"
                          aria-label={`Total vendido de ${linha.funcionario.nome}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            rascunhos[String(linha.funcionario.id)]
                              ?.total_valor ?? "0"
                          }
                          onChange={(event) =>
                            setRascunhos((atual) => ({
                              ...atual,
                              [String(linha.funcionario.id)]: {
                                ...atual[String(linha.funcionario.id)],
                                total_valor: event.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        moeda.format(linha.totalValor)
                      )}
                    </td>
                    <td>
                      <span className={classePercentual(linha.percentualValor)}>
                        {percentual.format(linha.percentualValor)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
