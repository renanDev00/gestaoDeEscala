const DIA_INDICE = {
  domingo: 0,
  segunda: 1,
  "segunda-feira": 1,
  terca: 2,
  terça: 2,
  "terça-feira": 2,
  quarta: 3,
  "quarta-feira": 3,
  quinta: 4,
  "quinta-feira": 4,
  sexta: 5,
  "sexta-feira": 5,
  sabado: 6,
  sábado: 6,
};

function paraMinutos(hora) {
  if (typeof hora === "number" && Number.isFinite(hora)) return hora;
  if (typeof hora !== "string") return null;
  const match = hora.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatarHora(minutos) {
  const normalizado = ((minutos % 1440) + 1440) % 1440;
  const horas = Math.floor(normalizado / 60);
  const mins = normalizado % 60;
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function idDe(valor) {
  if (valor && typeof valor === "object") return valor.id ?? valor.setor_id;
  return valor;
}

function obterDiaSemana(isDomingo, diaNome, dataRef) {
  if (isDomingo) return 0;
  const nome = String(diaNome || "")
    .trim()
    .toLocaleLowerCase("pt-BR");
  if (DIA_INDICE[nome] !== undefined) return DIA_INDICE[nome];
  return dataRef instanceof Date ? dataRef.getDay() : 0;
}

function mapaFluxoDoDia(fluxoData, diaSemana) {
  if (!fluxoData) return {};
  const dados = Array.isArray(fluxoData)
    ? fluxoData
    : (fluxoData[diaSemana] ?? fluxoData[String(diaSemana)]);

  if (!dados) return {};
  if (!Array.isArray(dados)) {
    return Object.fromEntries(
      Object.entries(dados).map(([hora, valor]) => [
        paraMinutos(hora) === null
          ? Number(hora)
          : Math.floor(paraMinutos(hora) / 60),
        Number(valor) || 0,
      ]),
    );
  }

  const nomeDia = Object.keys(DIA_INDICE).find(
    (nome) => DIA_INDICE[nome] === diaSemana && nome.length > 3,
  );
  const dia = dados.find((item) => {
    if (Number.isInteger(item.diaSemana)) return item.diaSemana === diaSemana;
    if (Number.isInteger(item.dia)) return item.dia === diaSemana;
    const nome = String(item.dia || item.nome || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
    return DIA_INDICE[nome] === diaSemana || nome.includes(nomeDia || "");
  });
  const valores = dia?.valores || dia?.horas || [];

  return Object.fromEntries(
    valores
      .map((item) => {
        const minuto = paraMinutos(item.hora);
        if (minuto === null) return null;
        return [
          Math.floor(minuto / 60),
          Number(item.valor ?? item.qtd ?? 0) || 0,
        ];
      })
      .filter(Boolean),
  );
}

function fluxoNaHora(fluxoPorHora, minuto) {
  const hora = Math.floor((((minuto % 1440) + 1440) % 1440) / 60);
  if (Object.hasOwn(fluxoPorHora, hora)) return fluxoPorHora[hora];
  const horasDisponiveis = Object.keys(fluxoPorHora)
    .map(Number)
    .filter(Number.isFinite);
  if (horasDisponiveis.length === 0) return 0;
  const horaMaisProxima = horasDisponiveis.reduce((maisProxima, candidata) =>
    Math.abs(candidata - hora) < Math.abs(maisProxima - hora)
      ? candidata
      : maisProxima,
  );
  return fluxoPorHora[horaMaisProxima] || 0;
}

function obterTurno(funcionario, turnos) {
  const referencia = funcionario.turno;
  if (referencia && typeof referencia === "object") return referencia;
  return turnos.find((turno) => String(turno.id) === String(referencia)) || {};
}

function obterSetor(funcionario, setores) {
  const referencia = funcionario.setor;
  if (referencia && typeof referencia === "object") return referencia;
  return (
    setores.find((setor) => String(setor.id) === String(referencia)) || {
      id: referencia,
      min_pessoas:
        funcionario.min_pessoas ?? funcionario.minimoFuncionarios ?? 0,
    }
  );
}

function normalizarJanela(inicioValor, fimValor) {
  const inicio = paraMinutos(inicioValor);
  const fimOriginal = paraMinutos(fimValor);
  if (inicio === null || fimOriginal === null) return null;
  const fim = fimOriginal <= inicio ? fimOriginal + 1440 : fimOriginal;
  return fim > inicio ? { inicio, fim } : null;
}

function distribuirJanela({
  grupos,
  funcionariosSetor,
  fluxoPorHora,
  setores,
  duracao,
  inicioCampo,
  fimCampo,
  ocupacaoPorSetor,
  debugCampo,
  horarioCampo,
}) {
  for (const grupo of grupos) {
    const janela = normalizarJanela(
      grupo.turno[inicioCampo],
      grupo.turno[fimCampo],
    );
    if (!janela) {
      for (const funcionario of grupo.funcionarios) {
        funcionario[horarioCampo] = "—";
        funcionario[debugCampo] = null;
      }
      continue;
    }

    const slots = [];
    for (
      let slotMin = janela.inicio;
      slotMin + duracao <= janela.fim;
      slotMin += duracao
    ) {
      slots.push(slotMin);
    }

    for (const funcionario of grupo.funcionarios) {
      if (slots.length === 0) {
        funcionario[horarioCampo] = "—";
        funcionario[debugCampo] = null;
        continue;
      }

      const setorId = idDe(funcionario.setor);
      const setor = setores.find((item) => String(item.id) === String(setorId));
      const minSetor = Number(
        setor?.min_pessoas ??
          setor?.minimoFuncionarios ??
          funcionario.min_pessoas ??
          funcionario.minimoFuncionarios ??
          0,
      );
      const ocupado = ocupacaoPorSetor.get(String(setorId)) || new Map();
      const avaliacoes = slots.map((slotMin) => {
        const presentes = (funcionariosSetor.get(String(setorId)) || []).reduce(
          (total, candidato) => {
            const turno = candidato.turno;
            const entrada = paraMinutos(turno.entrada ?? turno.horario_entrada);
            const saida = paraMinutos(turno.saida ?? turno.horario_saida);
            if (entrada === null || saida === null) return total;
            for (
              let diaOffset = Math.floor(slotMin / 1440) - 1;
              diaOffset <= Math.floor(slotMin / 1440) + 1;
              diaOffset += 1
            ) {
              const entradaAbsoluta = diaOffset * 1440 + entrada;
              let saidaAbsoluta = diaOffset * 1440 + saida;
              if (saida <= entrada) saidaAbsoluta += 1440;
              if (entradaAbsoluta <= slotMin && slotMin < saidaAbsoluta) {
                return total + 1;
              }
            }
            return total;
          },
          0,
        );
        const emIntervalo = ocupado.get(slotMin) || 0;
        // A carga do setor deve ser medida sobre quem ainda está disponível naquele
        // horário. O mínimo do setor não reduz o divisor porque ele representa a
        // cobertura mínima e não o custo da pausa em si.
        const disponiveis = presentes - emIntervalo;
        const fluxo =
          fluxoNaHora(fluxoPorHora, slotMin) / (duracao === 15 ? 4 : 1);
        return {
          slotMin,
          fluxo,
          presentes,
          emIntervalo,
          minSetor,
          disponiveis,
          fluxoPorPessoa:
            disponiveis >= 1 ? fluxo / disponiveis : Number.POSITIVE_INFINITY,
        };
      });

      const validos = avaliacoes.filter((item) => item.disponiveis >= 1);
      const selecionado = validos.length
        ? validos.reduce((melhor, atual) =>
            atual.fluxoPorPessoa < melhor.fluxoPorPessoa ? atual : melhor,
          )
        : avaliacoes.reduce((melhor, atual) =>
            atual.emIntervalo < melhor.emIntervalo ? atual : melhor,
          );

      ocupado.set(
        selecionado.slotMin,
        (ocupado.get(selecionado.slotMin) || 0) + 1,
      );
      ocupacaoPorSetor.set(String(setorId), ocupado);
      funcionario[horarioCampo] =
        `${formatarHora(selecionado.slotMin)}–${formatarHora(selecionado.slotMin + duracao)}`;
      funcionario[debugCampo] = {
        slotMin: selecionado.slotMin,
        fluxo: selecionado.fluxo,
        presentes: selecionado.presentes,
        emIntervalo: selecionado.emIntervalo,
        minSetor: selecionado.minSetor,
        disponiveis: selecionado.disponiveis,
      };
    }
  }
}

export function distribuirIntervalos(
  funcionariosAtivos,
  isDomingo,
  diaNome,
  dataRef,
  configuracao = {},
) {
  const turnos = configuracao.turnos || [];
  const setores = configuracao.setores || [];
  const fluxoData = configuracao.fluxoData || {};
  const diaSemana = obterDiaSemana(isDomingo, diaNome, dataRef);
  const fluxoPorHora = mapaFluxoDoDia(fluxoData, diaSemana);
  const resultado = funcionariosAtivos.map((funcionario) => {
    const setor = obterSetor(funcionario, setores);
    const turno = obterTurno(funcionario, turnos);
    return {
      ...funcionario,
      _setorOriginal: funcionario.setor,
      _turnoOriginal: funcionario.turno,
      setor,
      turno: {
        ...turno,
        entrada: turno.entrada ?? turno.horario_entrada,
        saida: turno.saida ?? turno.horario_saida,
        almocoInicio:
          turno.almocoInicio ?? turno.inicio_intervalo ?? turno.intervaloInicio,
        almocoFim: turno.almocoFim ?? turno.fim_intervalo ?? turno.intervaloFim,
        descansoInicio:
          turno.descansoInicio ?? turno.inicio_descanso ?? turno.descansoinicio,
        descansoFim: turno.descansoFim ?? turno.fim_descanso,
      },
      horarioAlmoco: "—",
      horarioDescanso: "—",
      _debugAlmoco: null,
      _debugDescanso: null,
    };
  });

  const gruposMap = new Map();
  for (const funcionario of resultado) {
    const turno = funcionario.turno;
    const setor = funcionario.setor;
    const chave = `${String(idDe(setor))}|${String(turno.id ?? funcionario.turno_id ?? turno.nome ?? "")}`;
    if (!gruposMap.has(chave)) {
      gruposMap.set(chave, { setor, turno, funcionarios: [] });
    }
    gruposMap.get(chave).funcionarios.push(funcionario);
  }

  const grupos = [...gruposMap.values()].sort((a, b) => {
    const horaA = paraMinutos(a.turno.entrada ?? a.turno.horario_entrada) ?? 0;
    const horaB = paraMinutos(b.turno.entrada ?? b.turno.horario_entrada) ?? 0;
    return horaA - horaB;
  });
  const funcionariosPorSetor = new Map();
  for (const funcionario of resultado) {
    const setorId = String(idDe(funcionario.setor));
    if (!funcionariosPorSetor.has(setorId)) {
      funcionariosPorSetor.set(setorId, []);
    }
    funcionariosPorSetor.get(setorId).push(funcionario);
  }

  distribuirJanela({
    grupos,
    funcionariosSetor: funcionariosPorSetor,
    fluxoPorHora,
    setores,
    duracao: 60,
    inicioCampo: "almocoInicio",
    fimCampo: "almocoFim",
    ocupacaoPorSetor: new Map(),
    debugCampo: "_debugAlmoco",
    horarioCampo: "horarioAlmoco",
  });

  distribuirJanela({
    grupos,
    funcionariosSetor: funcionariosPorSetor,
    fluxoPorHora,
    setores,
    duracao: 15,
    inicioCampo: "descansoInicio",
    fimCampo: "descansoFim",
    ocupacaoPorSetor: new Map(),
    debugCampo: "_debugDescanso",
    horarioCampo: "horarioDescanso",
  });

  return resultado.map(
    ({ _setorOriginal, _turnoOriginal, ...funcionario }) => ({
      ...funcionario,
      setor: _setorOriginal,
      turno: _turnoOriginal,
    }),
  );
}
