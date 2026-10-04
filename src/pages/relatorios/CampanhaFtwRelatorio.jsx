import { useMemo, useState } from "react";
import {
  BadgePercent,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  X,
} from "lucide-react";
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

function encontrarFaixa(faixas, valorPercentual) {
  return (
    faixas.find((faixa) => {
      const minimo = Number(faixa.percentual_min);
      const maximo =
        faixa.percentual_max === null ? null : Number(faixa.percentual_max);
      return (
        valorPercentual >= minimo &&
        (maximo === null || valorPercentual < maximo)
      );
    }) || null
  );
}

function formatoPercentual(valor) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
    Number(valor),
  );
}

function rotuloFaixa(faixa) {
  if (!faixa) return "";
  return faixa.percentual_max === null
    ? `${formatoPercentual(faixa.percentual_min)}% ou mais`
    : `${formatoPercentual(faixa.percentual_min)}%–${formatoPercentual(faixa.percentual_max)}%`;
}

function proximaCompetencia(mes) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const data = new Date(ano, numeroMes - 2, 1, 12);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function faixaSobrepoe(a, b) {
  const limiteA =
    a.percentual_max === null ? Infinity : Number(a.percentual_max);
  const limiteB =
    b.percentual_max === null ? Infinity : Number(b.percentual_max);
  return (
    Number(a.percentual_min) < limiteB && Number(b.percentual_min) < limiteA
  );
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
  const [bonificacaoAberta, setBonificacaoAberta] = useState(false);
  const [salvandoFaixa, setSalvandoFaixa] = useState(false);
  const [editandoFaixaId, setEditandoFaixaId] = useState(null);
  const [faixaForm, setFaixaForm] = useState({
    tipo: "pares",
    percentual_min: "",
    percentual_max: "",
    valor_bonificacao: "",
  });

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
  const {
    data: bonificacoes,
    loading: carregandoBonificacoes,
    refetch: recarregarBonificacoes,
  } = useSupabase("campanhas_ftw_bonificacoes");
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
  const bonificacoesDaCampanha = useMemo(
    () =>
      bonificacoes
        .filter(
          (faixa) =>
            campanha && String(faixa.campanha_id) === String(campanha.id),
        )
        .sort((a, b) => Number(a.percentual_min) - Number(b.percentual_min)),
    [bonificacoes, campanha],
  );
  const faixasPares = useMemo(
    () => bonificacoesDaCampanha.filter((faixa) => faixa.tipo === "pares"),
    [bonificacoesDaCampanha],
  );
  const faixasValor = useMemo(
    () => bonificacoesDaCampanha.filter((faixa) => faixa.tipo === "valor"),
    [bonificacoesDaCampanha],
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
      const faixaPares = encontrarFaixa(
        faixasPares,
        (totalPares / Number(campanha.meta_pares)) * 100,
      );
      const bateuMetaPares = totalPares >= Number(campanha.meta_pares);
      const faixaValorEncontrada = encontrarFaixa(
        faixasValor,
        (totalValor / Number(campanha.meta_valor)) * 100,
      );
      const faixaValorBloqueada = !bateuMetaPares ? faixaValorEncontrada : null;
      const faixaValor = bateuMetaPares ? faixaValorEncontrada : null;
      const bonusPares = Number(faixaPares?.valor_bonificacao || 0);
      const bonusValor = Number(faixaValor?.valor_bonificacao || 0);
      const proximaFaixaPares =
        faixasPares.find(
          (faixa) =>
            Number(faixa.percentual_min) >
            (totalPares / Number(campanha.meta_pares)) * 100,
        ) || null;
      const proximaFaixaValor =
        faixasValor.find(
          (faixa) =>
            Number(faixa.percentual_min) >
            (totalValor / Number(campanha.meta_valor)) * 100,
        ) || null;
      return {
        funcionario,
        totalPares,
        totalValor,
        percentualPares: (totalPares / Number(campanha.meta_pares)) * 100,
        percentualValor: (totalValor / Number(campanha.meta_valor)) * 100,
        paresRestantes,
        diasRestantes,
        mediaDiaria: diasRestantes ? paresRestantes / diasRestantes : null,
        faixaPares,
        faixaValor,
        faixaValorBloqueada,
        bateuMetaPares,
        bonusPares,
        bonusValor,
        ganhoAtual: bonusPares + bonusValor,
        proximaFaixaPares,
        paresFaltando: proximaFaixaPares
          ? Math.max(
              Math.ceil(
                (Number(campanha.meta_pares) *
                  Number(proximaFaixaPares.percentual_min)) /
                  100,
              ) - totalPares,
              0,
            )
          : null,
        proximaFaixaValor,
        valorFaltando: proximaFaixaValor
          ? Math.max(
              (Number(campanha.meta_valor) *
                Number(proximaFaixaValor.percentual_min)) /
                100 -
                totalValor,
              0,
            )
          : null,
      };
    });
  }, [
    ausencias,
    campanha,
    faixasPares,
    faixasValor,
    funcionariosFtw,
    gruposDomingo,
    mesSelecionado,
    mudancas,
    rascunhos,
    resultadosDaCampanha,
    trocas,
  ]);

  const totalGanhoAtual = useMemo(
    () => linhas.reduce((total, linha) => total + linha.ganhoAtual, 0),
    [linhas],
  );

  const carregando =
    carregandoFuncionarios ||
    carregandoSetores ||
    carregandoCampanhas ||
    carregandoResultados ||
    carregandoBonificacoes ||
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

  const imprimirRelatorio = () => {
    const limparModoImpressao = () => {
      document.body.classList.remove("campaign-print-mode");
    };
    document.body.classList.add("campaign-print-mode");
    window.addEventListener("afterprint", limparModoImpressao, { once: true });
    window.print();
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
    setBonificacaoAberta(false);
    setEditandoFaixaId(null);
    setFaixaForm({
      tipo: "pares",
      percentual_min: "",
      percentual_max: "",
      valor_bonificacao: "",
    });
    if (modoEdicao) cancelarEdicao();
  };

  const iniciarEdicaoFaixa = (faixa) => {
    setEditandoFaixaId(faixa.id);
    setFaixaForm({
      tipo: faixa.tipo,
      percentual_min: String(faixa.percentual_min),
      percentual_max:
        faixa.percentual_max === null ? "" : String(faixa.percentual_max),
      valor_bonificacao: String(faixa.valor_bonificacao),
    });
    setBonificacaoAberta(true);
  };

  const salvarFaixa = async (event, tipo = faixaForm.tipo) => {
    event.preventDefault();
    if (!campanha || salvandoFaixa) return;
    const minimo = Number(faixaForm.percentual_min);
    const maximo =
      faixaForm.percentual_max.trim() === ""
        ? null
        : Number(faixaForm.percentual_max);
    const valor = Number(faixaForm.valor_bonificacao);
    if (
      !Number.isFinite(minimo) ||
      minimo < 0 ||
      (maximo !== null && (!Number.isFinite(maximo) || maximo <= minimo)) ||
      !Number.isFinite(valor) ||
      valor <= 0
    ) {
      window.alert(
        "Informe um mínimo maior ou igual a zero, um máximo maior que o mínimo e uma bonificação maior que zero.",
      );
      return;
    }
    const demaisFaixas = bonificacoesDaCampanha.filter(
      (faixa) =>
        faixa.tipo === tipo && String(faixa.id) !== String(editandoFaixaId),
    );
    const candidata = { percentual_min: minimo, percentual_max: maximo };
    const conflito = demaisFaixas.find((faixa) =>
      faixaSobrepoe(candidata, faixa),
    );
    if (conflito) {
      window.alert(`Esta faixa se sobrepõe à faixa ${rotuloFaixa(conflito)}.`);
      return;
    }
    if (
      maximo === null &&
      demaisFaixas.some((faixa) => Number(faixa.percentual_min) > minimo)
    ) {
      const posterior = demaisFaixas.find(
        (faixa) => Number(faixa.percentual_min) > minimo,
      );
      window.alert(
        `A faixa aberta precisa ser a última. Existe uma faixa posterior iniciando em ${formatoPercentual(posterior.percentual_min)}%.`,
      );
      return;
    }
    const payload = {
      campanha_id: campanha.id,
      tipo,
      percentual_min: minimo,
      percentual_max: maximo,
      valor_bonificacao: Number(valor.toFixed(2)),
    };
    setSalvandoFaixa(true);
    const resposta = editandoFaixaId
      ? await supabase
          .from("campanhas_ftw_bonificacoes")
          .update(payload)
          .eq("id", editandoFaixaId)
      : await supabase.from("campanhas_ftw_bonificacoes").insert(payload);
    if (resposta.error) {
      window.alert(`Erro ao salvar a faixa.\n\n${resposta.error.message}`);
      setSalvandoFaixa(false);
      return;
    }
    await recarregarBonificacoes();
    setEditandoFaixaId(null);
    setFaixaForm({
      tipo,
      percentual_min: "",
      percentual_max: "",
      valor_bonificacao: "",
    });
    setSalvandoFaixa(false);
  };

  const excluirFaixa = async (faixa) => {
    if (!window.confirm(`Excluir a faixa ${rotuloFaixa(faixa)}?`)) return;
    const { error } = await supabase
      .from("campanhas_ftw_bonificacoes")
      .delete()
      .eq("id", faixa.id);
    if (error) {
      window.alert(`Erro ao excluir a faixa.\n\n${error.message}`);
      return;
    }
    await recarregarBonificacoes();
    if (String(editandoFaixaId) === String(faixa.id)) {
      setEditandoFaixaId(null);
      setFaixaForm({
        tipo: faixa.tipo,
        percentual_min: "",
        percentual_max: "",
        valor_bonificacao: "",
      });
    }
  };

  const copiarFaixasMesAnterior = async () => {
    if (!campanha) return;
    const mesAnterior = proximaCompetencia(campanha.mes);
    const campanhaAnterior = campanhas.find((item) => item.mes === mesAnterior);
    const origem = bonificacoes.filter(
      (faixa) =>
        campanhaAnterior &&
        String(faixa.campanha_id) === String(campanhaAnterior.id),
    );
    if (!origem.length) {
      window.alert(
        "O mês anterior não possui faixas de bonificação cadastradas.",
      );
      return;
    }
    if (
      bonificacoesDaCampanha.length > 0 &&
      !window.confirm(
        "Já existem faixas nesta campanha. Deseja substituir todas pelas faixas do mês anterior?",
      )
    )
      return;
    if (bonificacoesDaCampanha.length > 0) {
      const { error } = await supabase
        .from("campanhas_ftw_bonificacoes")
        .delete()
        .eq("campanha_id", campanha.id);
      if (error) {
        window.alert(`Erro ao substituir as faixas.\n\n${error.message}`);
        return;
      }
    }
    const { error } = await supabase.from("campanhas_ftw_bonificacoes").insert(
      origem.map(
        ({ tipo, percentual_min, percentual_max, valor_bonificacao }) => ({
          campanha_id: campanha.id,
          tipo,
          percentual_min,
          percentual_max,
          valor_bonificacao,
        }),
      ),
    );
    if (error) {
      window.alert(`Erro ao copiar as faixas.\n\n${error.message}`);
      return;
    }
    await recarregarBonificacoes();
    setEditandoFaixaId(null);
    setFaixaForm({
      tipo: "pares",
      percentual_min: "",
      percentual_max: "",
      valor_bonificacao: "",
    });
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
  const possuiFaixas = bonificacoesDaCampanha.length > 0;

  const renderEditorFaixas = (tipo, titulo, faixas) => (
    <section className="campaign-tier-editor" key={tipo}>
      <h3>{titulo}</h3>
      {tipo === "valor" && (
        <p className="campaign-tier-notice">
          A bonificação de valor só é liberada depois que o funcionário bate
          100% da meta de pares.
        </p>
      )}
      {faixas.length ? (
        <ul className="campaign-tier-list">
          {faixas.map((faixa) => (
            <li key={faixa.id}>
              <span>
                {rotuloFaixa(faixa)} →{" "}
                {moeda.format(Number(faixa.valor_bonificacao))}
              </span>
              <span className="campaign-tier-actions">
                <button
                  type="button"
                  className="campaign-icon-button"
                  aria-label={`Editar faixa ${rotuloFaixa(faixa)}`}
                  onClick={() => iniciarEdicaoFaixa(faixa)}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="campaign-icon-button campaign-icon-button--danger"
                  aria-label={`Excluir faixa ${rotuloFaixa(faixa)}`}
                  onClick={() => excluirFaixa(faixa)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="campaign-tier-empty">Nenhuma faixa cadastrada</p>
      )}
      <form
        className="campaign-tier-form"
        onSubmit={(event) => salvarFaixa(event, tipo)}
      >
        <label className="campaign-field">
          De (%)
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={faixaForm.tipo === tipo ? faixaForm.percentual_min : ""}
            onChange={(event) =>
              setFaixaForm({
                ...faixaForm,
                tipo,
                percentual_min: event.target.value,
              })
            }
          />
        </label>
        <label className="campaign-field">
          Até (%)
          <input
            type="number"
            min="0"
            step="0.01"
            value={faixaForm.tipo === tipo ? faixaForm.percentual_max : ""}
            onChange={(event) =>
              setFaixaForm({
                ...faixaForm,
                tipo,
                percentual_max: event.target.value,
              })
            }
          />
        </label>
        <label className="campaign-field">
          Bonificação (R$)
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={faixaForm.tipo === tipo ? faixaForm.valor_bonificacao : ""}
            onChange={(event) =>
              setFaixaForm({
                ...faixaForm,
                tipo,
                valor_bonificacao: event.target.value,
              })
            }
          />
        </label>
        <div className="campaign-tier-form-actions">
          <button
            type="submit"
            className="campaign-button campaign-button--primary"
            disabled={salvandoFaixa}
          >
            {editandoFaixaId && faixaForm.tipo === tipo ? (
              <Save size={16} aria-hidden="true" />
            ) : (
              <Plus size={16} aria-hidden="true" />
            )}
            {salvandoFaixa
              ? "Salvando..."
              : editandoFaixaId && faixaForm.tipo === tipo
                ? "Salvar faixa"
                : "Adicionar faixa"}
          </button>
          {editandoFaixaId && faixaForm.tipo === tipo && (
            <button
              type="button"
              className="campaign-button"
              onClick={() => {
                setEditandoFaixaId(null);
                setFaixaForm({
                  tipo,
                  percentual_min: "",
                  percentual_max: "",
                  valor_bonificacao: "",
                });
              }}
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </section>
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
        <button
          type="button"
          className="campaign-button"
          onClick={() => setBonificacaoAberta((aberta) => !aberta)}
          disabled={!campanha}
          title={
            !campanha
              ? "Cadastre a campanha do mês primeiro"
              : "Cadastrar bonificação"
          }
        >
          <BadgePercent size={16} aria-hidden="true" />
          Cadastrar bonificação
        </button>
        <button
          type="button"
          className="campaign-button campaign-button--primary"
          onClick={imprimirRelatorio}
          aria-label="Imprimir relatório da Campanha FTW"
        >
          <Printer size={16} aria-hidden="true" />
          Imprimir
        </button>
      </div>

      {formularioAberto && (
        <form
          className="table-panel campaign-form no-print"
          onSubmit={salvarCampanha}
        >
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

      {bonificacaoAberta && campanha && (
        <section className="table-panel campaign-form no-print">
          <div className="panel-header">
            <div>
              <h2>Bonificações de {formatarMes(campanha.mes)}</h2>
              <span className="campaign-subtitle">
                Faixas com limite mínimo inclusivo e máximo exclusivo
              </span>
            </div>
            <div className="campaign-actions">
              <button
                type="button"
                className="campaign-button"
                onClick={copiarFaixasMesAnterior}
              >
                Copiar faixas do mês anterior
              </button>
              <button
                type="button"
                className="campaign-icon-button"
                aria-label="Fechar bonificações"
                onClick={() => {
                  setBonificacaoAberta(false);
                  setEditandoFaixaId(null);
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="campaign-tier-editors">
            {renderEditorFaixas(
              "pares",
              "Faixas de pares (% da meta de pares)",
              faixasPares,
            )}
            {renderEditorFaixas(
              "valor",
              "Faixas de valor de venda (% da meta de valor)",
              faixasValor,
            )}
          </div>
        </section>
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
        <>
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
            {!possuiFaixas && (
              <p className="campaign-bonus-empty-note">
                Nenhuma bonificação cadastrada para esta campanha.
              </p>
            )}
            <div className="table-wrapper campaign-table-wrapper">
              <table
                className={`campaign-table ${possuiFaixas ? "campaign-table--bonuses" : "campaign-table--without-bonuses"}`}
              >
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th title="Meta individual de pares">Meta pares</th>
                    <th title="Total de pares vendidos">Pares vendidos</th>
                    <th title="Percentual de atingimento da meta de pares">
                      % pares
                    </th>
                    <th title="Média diária de pares necessária">Pares/dia</th>
                    <th title="Meta individual de valor">Meta R$</th>
                    <th title="Total vendido em reais">Vendido R$</th>
                    <th title="Percentual de atingimento da meta de valor">
                      % valor
                    </th>
                    {possuiFaixas && (
                      <th title="Bonificação por pares">Bônus pares</th>
                    )}
                    {possuiFaixas && (
                      <th title="Bonificação por valor de venda">
                        Bônus valor
                      </th>
                    )}
                    <th title="Total de bonificações já liberadas">
                      Ganho atual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.funcionario.id}>
                      <td className="campaign-name">
                        {linha.funcionario.nome}
                      </td>
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
                        <span
                          className={classePercentual(linha.percentualPares)}
                        >
                          {percentual.format(linha.percentualPares)}%
                        </span>
                      </td>
                      <td>
                        {linha.paresRestantes === 0 ? (
                          <span className="campaign-target-hit">
                            Meta batida
                          </span>
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
                        <span
                          className={classePercentual(linha.percentualValor)}
                        >
                          {percentual.format(linha.percentualValor)}%
                        </span>
                      </td>
                      {possuiFaixas && (
                        <>
                          <td>
                            {linha.faixaPares ? (
                              <span className="campaign-bonus-cell">
                                <strong>
                                  {moeda.format(linha.bonusPares)}
                                </strong>
                                <small>{rotuloFaixa(linha.faixaPares)}</small>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {linha.faixaValor ? (
                              <span className="campaign-bonus-cell">
                                <strong>
                                  {moeda.format(linha.bonusValor)}
                                </strong>
                                <small>{rotuloFaixa(linha.faixaValor)}</small>
                              </span>
                            ) : linha.faixaValorBloqueada ? (
                              <span
                                className="campaign-locked-badge"
                                title={`Bata a meta de pares para liberar (faixa atual: ${rotuloFaixa(linha.faixaValorBloqueada)} → ${moeda.format(Number(linha.faixaValorBloqueada.valor_bonificacao))})`}
                              >
                                Bloqueada
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      )}
                      <td>
                        {possuiFaixas ? (
                          <span
                            className={`campaign-current-gain ${linha.ganhoAtual > 0 ? "campaign-current-gain--positive" : ""}`}
                          >
                            <strong>{moeda.format(linha.ganhoAtual)}</strong>
                            <small>
                              {linha.proximaFaixaPares
                                ? `Faltam ${linha.paresFaltando} pares para ${moeda.format(Number(linha.proximaFaixaPares.valor_bonificacao))}`
                                : linha.bateuMetaPares &&
                                    linha.proximaFaixaValor
                                  ? `Faltam ${moeda.format(linha.valorFaltando)} em vendas para ${moeda.format(Number(linha.proximaFaixaValor.valor_bonificacao))}`
                                  : "Faixa máxima atingida"}
                            </small>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {possuiFaixas && (
                  <tfoot>
                    <tr className="campaign-bonus-total-row">
                      <th scope="row" colSpan={possuiFaixas ? 10 : 8}>
                        Custo total de bonificação
                      </th>
                      <td>{moeda.format(totalGanhoAtual)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
          <section className="table-panel campaign-tiers">
            <header className="panel-header">
              <div>
                <h2>Faixas de ganho</h2>
                <span className="campaign-subtitle">
                  {formatarMes(campanha.mes)}
                </span>
              </div>
            </header>
            <div className="campaign-tiers-grid">
              <section className="campaign-tier-summary">
                <h3>Faixas de pares</h3>
                <div className="table-wrapper campaign-tier-table-wrap">
                  <table className="campaign-tier-table">
                    <thead>
                      <tr>
                        <th>Faixa (%)</th>
                        <th>Pares necessários</th>
                        <th>Bonificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faixasPares.length ? (
                        faixasPares.map((faixa) => {
                          const min = Math.ceil(
                            (Number(campanha.meta_pares) *
                              Number(faixa.percentual_min)) /
                              100,
                          );
                          const max =
                            faixa.percentual_max === null
                              ? null
                              : Math.ceil(
                                  (Number(campanha.meta_pares) *
                                    Number(faixa.percentual_max)) /
                                    100,
                                ) - 1;
                          return (
                            <tr key={faixa.id}>
                              <td>{rotuloFaixa(faixa)}</td>
                              <td>
                                {max === null
                                  ? `${min} pares ou mais`
                                  : `${min} a ${max} pares`}
                              </td>
                              <td>
                                {moeda.format(Number(faixa.valor_bonificacao))}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3">
                            <span>Nenhuma faixa cadastrada</span>{" "}
                            <button
                              type="button"
                              className="campaign-inline-link"
                              onClick={() => {
                                setBonificacaoAberta(true);
                                setFaixaForm({ ...faixaForm, tipo: "pares" });
                              }}
                            >
                              Cadastrar bonificação
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="campaign-tier-summary">
                <h3>Faixas de valor de venda</h3>
                <p className="campaign-tier-notice">
                  Liberada somente após atingir 100% da meta de pares.
                </p>
                <div className="table-wrapper campaign-tier-table-wrap">
                  <table className="campaign-tier-table">
                    <thead>
                      <tr>
                        <th>Faixa (%)</th>
                        <th>Valor de venda necessário</th>
                        <th>Bonificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faixasValor.length ? (
                        faixasValor.map((faixa) => {
                          const minimo =
                            (Number(campanha.meta_valor) *
                              Number(faixa.percentual_min)) /
                            100;
                          const maximo =
                            faixa.percentual_max === null
                              ? null
                              : (Number(campanha.meta_valor) *
                                  Number(faixa.percentual_max)) /
                                100;
                          return (
                            <tr key={faixa.id}>
                              <td>{rotuloFaixa(faixa)}</td>
                              <td>
                                {maximo === null
                                  ? `${moeda.format(minimo)} ou mais`
                                  : `${moeda.format(minimo)} a ${moeda.format(maximo)}`}
                              </td>
                              <td>
                                {moeda.format(Number(faixa.valor_bonificacao))}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3">
                            <span>Nenhuma faixa cadastrada</span>{" "}
                            <button
                              type="button"
                              className="campaign-inline-link"
                              onClick={() => {
                                setBonificacaoAberta(true);
                                setFaixaForm({ ...faixaForm, tipo: "valor" });
                              }}
                            >
                              Cadastrar bonificação
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
