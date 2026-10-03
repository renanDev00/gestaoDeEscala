import { useState, useRef } from "react";
import { Printer } from "lucide-react";
import { useSupabase } from "../../hooks/useSupabase";
import {
  resolverDia,
  getDaysOfWeek,
  AUSENCIA_LABELS,
} from "../../utils/domingoUtils";

const DIAS_SEMANA_BANCO = [
  { num: 1, label: "Segunda" },
  { num: 2, label: "Terça" },
  { num: 3, label: "Quarta" },
  { num: 4, label: "Quinta" },
  { num: 5, label: "Sexta" },
  { num: 6, label: "Sábado" },
  { num: 7, label: "Domingo" },
];

function fmt(time) {
  if (!time) return "";
  return time.substring(0, 5);
}

function getSemanaAtual() {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + 3 - ((data.getDay() + 6) % 7));
  const week1 = new Date(data.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((data.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${data.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

// Estilo de célula por estado
function CelulaEstado({ estado, turnoMap, funcionario }) {
  if (estado.ausente) {
    const label = AUSENCIA_LABELS[estado.tipo] || "AUSENTE";
    const cores = {
      licenca_medica: { bg: "#fef3c7", color: "#92400e" },
      afastamento: { bg: "#fee2e2", color: "#991b1b" },
      folga: { bg: "#dcfce7", color: "#166534" },
      ferias: { bg: "#ede9fe", color: "#5b21b6" },
    };
    const cor = cores[estado.tipo] || { bg: "#f3f4f6", color: "#374151" };
    return (
      <strong
        style={{
          fontSize: "0.7rem",
          ...cor,
          padding: "2px 6px",
          borderRadius: "4px",
          display: "inline-block",
        }}
      >
        {label}
      </strong>
    );
  }

  if (estado.folga) {
    const label = estado.tipo === "troca_folga" ? "FOLGA ⇄" : "FOLGA";
    return (
      <strong style={{ color: "var(--orange-500)", fontSize: "0.75rem" }}>
        {label}
      </strong>
    );
  }

  const turno = turnoMap[estado.turno_id || funcionario.turno_id];
  const horarioStr = turno
    ? `${fmt(turno.horario_entrada)} às ${fmt(turno.horario_saida)}`
    : "-";

  return (
    <span style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
      {horarioStr}
      {estado.mudanca && (
        <span
          style={{
            display: "block",
            fontSize: "0.6rem",
            color: "var(--orange-500)",
            fontWeight: 700,
          }}
        >
          ✦ turno alt.
        </span>
      )}
    </span>
  );
}

export default function SemanalRelatorio() {
  const [semana, setSemana] = useState(getSemanaAtual());
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
    return <div className="zone-loading">Carregando relatório semanal...</div>;
  }

  const turnoMap = Object.fromEntries(turnosList.map((t) => [t.id, t]));
  const weekDates = getDaysOfWeek(semana);

  const ctx = {
    ausencias: ausenciasList,
    mudancas: mudancasList,
    trocas: trocasList,
    grupoDomList,
    dataInicioGlobal,
  };

  // Agrupa por setor (usando setor original para organização)
  const porSetor = setoresList
    .map((setor) => {
      const funcionariosDoSetor = funcionariosList.filter(
        (f) => String(f.setor_id) === String(setor.id),
      );

      funcionariosDoSetor.sort((a, b) => {
        const turnoA = turnoMap[a.turno_id];
        const turnoB = turnoMap[b.turno_id];
        const horaA = turnoA?.horario_entrada || "99:99";
        const horaB = turnoB?.horario_entrada || "99:99";
        return horaA.localeCompare(horaB);
      });

      return {
        setor,
        total: funcionariosDoSetor.length,
        funcionarios: funcionariosDoSetor,
      };
    })
    .filter((g) => g.total > 0);

  return (
    <>
      <div className="zone-controls no-print">
        <div className="zone-date-wrap">
          <label htmlFor="week-input" className="zone-date-label">
            Semana
          </label>
          <input
            id="week-input"
            type="week"
            className="zone-date-input"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="zone-print-btn"
          onClick={handlePrint}
          aria-label="Imprimir Escala Semanal"
        >
          <Printer size={17} aria-hidden="true" />
          Imprimir
        </button>
      </div>

      <div className="zone-report semanal-report" ref={printRef}>
        <header className="zone-report-header">
          <div className="zone-report-title-block">
            <h2 className="zone-report-title">Escala Semanal</h2>
            <span className="zone-report-date">Semana {semana}</span>
          </div>
        </header>

        {porSetor.length === 0 ? (
          <p className="zone-empty">Nenhum funcionário cadastrado.</p>
        ) : (
          porSetor.map(({ setor, total, funcionarios }) => (
            <div key={setor.id} className="zone-setor-block">
              <table className="zone-table">
                <thead>
                  <tr className="zone-table-sector-row">
                    <td colSpan={8}>
                      <span className="zone-sector-name">{setor.nome}</span>
                      <span className="zone-sector-meta">{total} func.</span>
                    </td>
                  </tr>
                  <tr className="zone-table-col-header">
                    <th>Nome</th>
                    {DIAS_SEMANA_BANCO.map((dia) => (
                      <th key={dia.num} style={{ textAlign: "center" }}>
                        {dia.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((f) => (
                    <tr key={f.id}>
                      <td className="zone-td-name">{f.nome}</td>
                      {DIAS_SEMANA_BANCO.map((dia, index) => {
                        const dateObj = weekDates[index];
                        const estado = dateObj
                          ? resolverDia(f, dateObj, ctx)
                          : { folga: Number(f.dia_folga) === dia.num };

                        return (
                          <td
                            key={dia.num}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <CelulaEstado
                              estado={estado}
                              turnoMap={turnoMap}
                              funcionario={f}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </>
  );
}
