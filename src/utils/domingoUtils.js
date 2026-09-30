export function getGrupoFolgaNoDomingo(data, dataInicioGlobal, grupos) {
  if (!dataInicioGlobal || !grupos || grupos.length === 0) return null;
  
  const start = new Date(dataInicioGlobal + "T00:00:00");
  const target = new Date(data);
  target.setHours(0,0,0,0);
  start.setHours(0,0,0,0);

  const startSun = new Date(start.getTime() - start.getDay() * 86400000);
  const targetSun = new Date(target.getTime() - target.getDay() * 86400000);

  const diffTime = targetSun.getTime() - startSun.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

  const sorted = [...grupos].sort((a,b) => (a.ordem || 0) - (b.ordem || 0));
  
  let groupIndex = diffWeeks % sorted.length;
  if (groupIndex < 0) groupIndex += sorted.length;

  return sorted[groupIndex].id;
}

export function isFolga(funcionario, date, dataInicioGlobal, gruposList) {
  const jsDay = date.getDay();
  const bancoDay = jsDay === 0 ? 7 : jsDay;

  if (bancoDay === 7) {
    if (funcionario.grupo_domingo_id) {
      const grupoOffId = getGrupoFolgaNoDomingo(date, dataInicioGlobal, gruposList);
      return String(funcionario.grupo_domingo_id) === String(grupoOffId);
    }
  }
  
  return Number(funcionario.dia_folga) === bancoDay;
}

export function getDaysOfWeek(weekString) {
  if (!weekString) return [];
  const [yearStr, weekStr] = weekString.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
  const days = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(ISOweekStart);
    current.setDate(ISOweekStart.getDate() + i);
    days.push(current);
  }
  return days;
}

// Rótulos amigáveis para tipos de ausência
export const AUSENCIA_LABELS = {
  licenca_medica: "LICENÇA",
  afastamento: "AFASTAMENTO",
  folga: "FOLGA EXTRA",
  ferias: "FÉRIAS",
};

/**
 * Resolve o estado efetivo de um funcionário em um dado Date.
 * 
 * Retorna um objeto com:
 *  - ausente: true  → funcionário está ausente (licença, férias etc.)
 *  - folga: true    → dia de folga (normal, troca ou grupo)
 *  - tipo: string   → tipo da ausência ou 'folga' ou 'troca_folga'
 *  - turno_id       → turno efetivo (pode ter sido mudado)
 *  - setor_id       → setor efetivo (pode ter sido mudado)
 */
export function resolverDia(funcionario, date, { ausencias, mudancas, trocas, grupoDomList, dataInicioGlobal }) {
  const dateStr = date.toISOString().slice(0, 10);

  // 1. Verificar ausência (licença, afastamento, férias, folga extra)
  const ausencia = (ausencias || []).find((a) =>
    String(a.funcionario_id) === String(funcionario.id) &&
    dateStr >= a.data_inicio &&
    dateStr <= a.data_fim
  );
  if (ausencia) {
    return { ausente: true, tipo: ausencia.tipo };
  }

  // 2. Troca de folga — destino: neste dia o funcionário ESTÁ de folga
  const trocaDestino = (trocas || []).find((t) =>
    String(t.funcionario_id) === String(funcionario.id) &&
    t.data_folga_destino === dateStr
  );
  if (trocaDestino) {
    return { folga: true, tipo: "troca_folga" };
  }

  // 3. Troca de folga — origem: neste dia o funcionário TRABALHA (não descansa)
  const trocaOrigem = (trocas || []).find((t) =>
    String(t.funcionario_id) === String(funcionario.id) &&
    t.data_folga_origem === dateStr
  );
  const folgaNormal = isFolga(funcionario, date, dataInicioGlobal, grupoDomList);
  if (folgaNormal && !trocaOrigem) {
    return { folga: true, tipo: "folga" };
  }

  // 4. Verificar mudança de turno/setor ativa no período
  const mudanca = (mudancas || []).find((m) =>
    String(m.funcionario_id) === String(funcionario.id) &&
    dateStr >= m.data_inicio &&
    dateStr <= m.data_fim
  );

  return {
    folga: false,
    turno_id: (mudanca?.turno_id) || funcionario.turno_id,
    setor_id: (mudanca?.setor_id) || funcionario.setor_id,
    mudanca: !!mudanca,
  };
}
