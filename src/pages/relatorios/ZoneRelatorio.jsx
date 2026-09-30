import { useState, useRef } from "react";
import { useSupabase } from "../../hooks/useSupabase";
import { resolverDia } from "../../utils/domingoUtils";

const DIAS_SEMANA = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

function jsDayToBanco(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

function fmt(time) {
  if (!time) return "-";
  return time.substring(0, 5);
}

function dataFormatada(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function ZoneRelatorio() {
  const today = new Date().toISOString().slice(0, 10);
  const [dataSelecionada, setDataSelecionada] = useState(today);
  const printRef = useRef(null);

  const { data: funcionariosList, loading: fLoading } =
    useSupabase("funcionarios");
  const { data: setoresList, loading: sLoading } = useSupabase("setores");
  const { data: turnosList, loading: tLoading } = useSupabase("turnos");
  const { data: grupoDomList, loading: gLoading } =
    useSupabase("grupo_domingo");
  const { data: ausenciasList, loading: aLoading } = useSupabase("ausencias");
  const { data: mudancasList, loading: mLoading } = useSupabase(
    "mudancas_turno_setor",
  );
  const { data: trocasList, loading: trLoading } = useSupabase("trocas_folga");

  const dataInicioGlobal = localStorage.getItem("data_inicio_domingo");

  const handlePrint = () => {
    window.print();
  };

  if (
    fLoading ||
    sLoading ||
    tLoading ||
    gLoading ||
    aLoading ||
    mLoading ||
    trLoading
  ) {
    return <div className="zone-loading">Carregando relatório...</div>;
  }

  const dataSel = new Date(dataSelecionada + "T00:00:00");
  const diaSemanaNum = jsDayToBanco(dataSel.getDay());
  const diaSemanaLabel = DIAS_SEMANA[diaSemanaNum];

  const ctx = {
    ausencias: ausenciasList,
    mudancas: mudancasList,
    trocas: trocasList,
    grupoDomList,
    dataInicioGlobal,
  };

  // Resolve o estado de cada funcionário para o dia
  const resolucoes = Object.fromEntries(
    funcionariosList.map((f) => [f.id, resolverDia(f, dataSel, ctx)]),
  );

  const funcionariosAtivos = funcionariosList.filter(
    (f) => !resolucoes[f.id].folga && !resolucoes[f.id].ausente,
  );
  const totalAusentes = funcionariosList.filter(
    (f) => resolucoes[f.id].ausente,
  ).length;
  const totalFolga = funcionariosList.filter(
    (f) => resolucoes[f.id].folga && !resolucoes[f.id].ausente,
  ).length;

  const turnoMap = Object.fromEntries(turnosList.map((t) => [t.id, t]));

  // Agrupa por setor considerando mudanças de setor
  const porSetor = setoresList
    .map((setor) => {
      const funcionariosDoSetor = funcionariosAtivos.filter((f) => {
        const res = resolucoes[f.id];
        return String(res.setor_id || f.setor_id) === String(setor.id);
      });

      const contagemTurnos = {};
      for (const f of funcionariosDoSetor) {
        const res = resolucoes[f.id];
        const turnoId = String(res.turno_id || f.turno_id);
        if (!contagemTurnos[turnoId]) {
          const turno = turnoMap[turnoId];
          contagemTurnos[turnoId] = {
            nome: turno ? turno.nome : "Sem Turno",
            horario_entrada: turno?.horario_entrada || "99:99",
            qtd: 0,
          };
        }
        contagemTurnos[turnoId].qtd += 1;
      }

      const resumoTurnos = Object.values(contagemTurnos)
        .sort((a, b) => a.horario_entrada.localeCompare(b.horario_entrada))
        .map((t) => `${t.qtd} ${t.nome}`)
        .join(" · ");

      funcionariosDoSetor.sort((a, b) => {
        const resA = resolucoes[a.id];
        const resB = resolucoes[b.id];
        const turnoA = turnoMap[resA.turno_id || a.turno_id];
        const turnoB = turnoMap[resB.turno_id || b.turno_id];
        const horaA = turnoA?.horario_entrada || "99:99";
        const horaB = turnoB?.horario_entrada || "99:99";
        return horaA.localeCompare(horaB);
      });

      return {
        setor,
        total: funcionariosDoSetor.length,
        resumoTurnos,
        funcionarios: funcionariosDoSetor,
      };
    })
    .filter((g) => g.total > 0);

  return (
    <>
      <div className="zone-controls no-print">
        <div className="zone-date-wrap">
          <label htmlFor="zone-date-input" className="zone-date-label">
            Data do relatório
          </label>
          <input
            id="zone-date-input"
            type="date"
            className="zone-date-input"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="zone-print-btn"
          onClick={handlePrint}
          aria-label="Imprimir relatório Zone"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 8H5a3 3 0 0 0-3 3v5h4v4h12v-4h4v-5a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm1-11H7V4h10v4zM8 13h2v2H8v-2z" />
          </svg>
          Imprimir
        </button>
      </div>

      <div className="zone-report" ref={printRef} id="zone-report">
        <header className="zone-report-header">
          <div className="zone-report-title-block">
            <h2 className="zone-report-title">Zone</h2>
            <span className="zone-report-date">
              {dataFormatada(dataSelecionada)}
            </span>
            <span className="zone-report-weekday">{diaSemanaLabel}</span>
          </div>
          <div className="zone-report-stats">
            <span className="zone-stat">
              <strong>{funcionariosList.length}</strong>
              <small>Total</small>
            </span>
            <span className="zone-stat-divider" />
            <span className="zone-stat">
              <strong>{funcionariosAtivos.length}</strong>
              <small>Ativos</small>
            </span>
            <span className="zone-stat-divider" />
            <span className="zone-stat zone-stat--folga">
              <strong>{totalFolga}</strong>
              <small>Folga</small>
            </span>
            {totalAusentes > 0 && (
              <>
                <span className="zone-stat-divider" />
                <span className="zone-stat" style={{ color: "#b45309" }}>
                  <strong>{totalAusentes}</strong>
                  <small>Ausentes</small>
                </span>
              </>
            )}
          </div>
        </header>

        {porSetor.length === 0 ? (
          <p className="zone-empty">Nenhum funcionário ativo nessa data.</p>
        ) : (
          porSetor.map(({ setor, total, resumoTurnos, funcionarios }) => (
            <div key={setor.id} className="zone-setor-block">
              <table className="zone-table">
                <thead>
                  <tr className="zone-table-sector-row">
                    <td colSpan={6}>
                      <span className="zone-sector-name">{setor.nome}</span>
                      <span className="zone-sector-meta">
                        {total} func. ({resumoTurnos})
                      </span>
                    </td>
                  </tr>
                  <tr className="zone-table-col-header">
                    <th>Nome</th>
                    <th>Turno</th>
                    <th>Entrada</th>
                    <th>Saída</th>
                    <th>Intervalo</th>
                    <th>Descanso</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((f) => {
                    const res = resolucoes[f.id];
                    const turno = turnoMap[res.turno_id || f.turno_id];
                    if (!turno) return null;
                    return (
                      <tr
                        key={f.id}
                        style={
                          res.mudanca
                            ? { background: "rgba(249,115,22,0.05)" }
                            : {}
                        }
                      >
                        <td className="zone-td-name">
                          {f.nome}
                          {res.mudanca && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--orange-500)",
                                marginLeft: "6px",
                                fontWeight: 700,
                              }}
                            >
                              ✦ mudança
                            </span>
                          )}
                        </td>
                        <td>{turno.nome}</td>
                        <td>{fmt(turno.horario_entrada)}</td>
                        <td>{fmt(turno.horario_saida)}</td>
                        <td>
                          {fmt(turno.inicio_intervalo)}
                          {turno.inicio_intervalo && turno.fim_intervalo
                            ? " – "
                            : ""}
                          {fmt(turno.fim_intervalo)}
                        </td>
                        <td>
                          {fmt(turno.inicio_descanso)}
                          {turno.inicio_descanso && turno.fim_descanso
                            ? " – "
                            : ""}
                          {fmt(turno.fim_descanso)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </>
  );
}
