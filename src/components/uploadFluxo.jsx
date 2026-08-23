import { useState } from "react";
import * as XLSX from "xlsx";
import fluxo, { atualizarFluxo, limparFluxo } from "../models/fluxo";

const getColorPorValor = (valor, min, max) => {
  if (
    valor === "-" ||
    valor === undefined ||
    valor === null ||
    Number(valor) === 0
  ) {
    return "rgba(148, 163, 184, 0.12)";
  }

  const ratio = max === min ? 1 : (Number(valor) - min) / (max - min);
  const base = { r: 249, g: 115, b: 22 };
  const pale = { r: 255, g: 237, b: 213 };

  const r = Math.round(pale.r + (base.r - pale.r) * ratio);
  const g = Math.round(pale.g + (base.g - pale.g) * ratio);
  const b = Math.round(pale.b + (base.b - pale.b) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
};

const getHoraEmMinutos = (hora = "") => {
  if (!hora || typeof hora !== "string") return Number.MAX_SAFE_INTEGER;

  const match = hora.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const [, horas, minutos] = match;
  return Number(horas) * 60 + Number(minutos);
};

function UploadFluxo() {
  const [diasSemana, setDiasSemana] = useState(() => [...fluxo]);

  const horasDisponiveis = [
    ...new Set(
      diasSemana.flatMap((dia) => dia.valores.map((item) => item.hora)),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => getHoraEmMinutos(a) - getHoraEmMinutos(b));

  const diasDisponiveis = diasSemana.map((dia) => dia.dia);
  const valoresNumericos = diasSemana.flatMap((dia) =>
    dia.valores
      .map((item) => Number(item.valor))
      .filter((valor) => !Number.isNaN(valor)),
  );
  const valorMin = valoresNumericos.length ? Math.min(...valoresNumericos) : 0;
  const valorMax = valoresNumericos.length ? Math.max(...valoresNumericos) : 0;

  const tabelaFluxo = horasDisponiveis.map((hora) => {
    const valorPorDia = {};

    diasSemana.forEach((dia) => {
      const item = dia.valores.find((v) => v.hora === hora);
      valorPorDia[dia.dia] = item ? item.valor : "-";
    });

    return {
      hora,
      valorPorDia,
    };
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (!isExcel) {
      limparFluxo();
      setDiasSemana([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(sheet, {
          range: 2,
          defval: "",
          raw: false,
        });

        const agrupado = {};
        linhas.forEach((linha) => {
          const dia = linha["Dia da Semana"] || linha["dia"] || linha["Dia"];
          const hora = linha["hora"] || linha["Hora"];
          const valor =
            linha["Soma de qtd_entrante"] ??
            linha["valor"] ??
            linha["Qtd. Entrante"];

          if (!dia) return;

          if (!agrupado[dia]) {
            agrupado[dia] = { dia, valores: [] };
          }

          agrupado[dia].valores.push({
            hora: hora || "-",
            valor: valor ?? 0,
          });
        });

        const dados = Object.values(agrupado);
        atualizarFluxo(dados);
        setDiasSemana(dados);
      } catch {
        limparFluxo();
        setDiasSemana([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="upload-fluxo">
      <div className="upload-box">
        <input
          id="upload-fluxo-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          hidden
        />

        <label htmlFor="upload-fluxo-file" className="upload-button">
          Importar fluxo .xlsx
        </label>

        <div className="upload-meta">
          <strong>
            {diasSemana.length ? "Fluxo carregado" : "Nenhum fluxo importado"}
          </strong>
          <span>
            {diasSemana.length
              ? `${diasSemana.length} dia(s) no modelo atual.`
              : "Selecione um arquivo para atualizar o modelo de fluxo."}
          </span>
        </div>
      </div>

      {diasSemana.length > 0 && (
        <div className="preview-box">
          <div className="table-header-row">
            <h3>Modelo de fluxo</h3>
            <div className="legend">
              <span>Menor</span>
              <div className="legend-gradient" aria-hidden="true" />
              <span>Maior</span>
            </div>
          </div>

          <div className="flow-grid-wrapper">
            <table className="flow-grid-table">
              <thead>
                <tr>
                  <th className="sticky-col">Hora</th>
                  {diasDisponiveis.map((dia) => (
                    <th key={dia}>{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabelaFluxo.map((linha) => (
                  <tr key={linha.hora}>
                    <td className="sticky-col hora-cell">{linha.hora}</td>
                    {diasDisponiveis.map((dia) => {
                      const valor = linha.valorPorDia[dia];
                      const numero = Number(valor);
                      const background = getColorPorValor(
                        valor,
                        valorMin,
                        valorMax,
                      );

                      return (
                        <td
                          key={`${linha.hora}-${dia}`}
                          style={{
                            background,
                            color:
                              valor === "-" || Number.isNaN(numero)
                                ? "#475569"
                                : "#111827",
                            fontWeight:
                              valor !== "-" && !Number.isNaN(numero)
                                ? 700
                                : 500,
                          }}
                        >
                          {valor === "-" ? "-" : valor}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadFluxo;
