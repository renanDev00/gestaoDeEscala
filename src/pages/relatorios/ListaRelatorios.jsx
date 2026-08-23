import funcionarios from "../../models/funcionarios";
import setores from "../../models/setores";
import turnos from "../../models/turnos";

export default function ListaRelatorios() {
  const totalFuncionarios = funcionarios.length;
  const totalSetores = setores.length;
  const totalTurnos = turnos.length;

  const coberturaMinima = setores.reduce(
    (total, setor) => total + setor.minimoFuncionarios,
    0,
  );

  const coberturaAtual = Math.round(
    (totalFuncionarios / Math.max(coberturaMinima, 1)) * 100,
  );

  const turnoMaisUtilizado = [...turnos]
    .map((turno) => ({
      nome: turno.nome,
      total: funcionarios.filter(
        (funcionario) => funcionario.turno === turno.id,
      ).length,
    }))
    .sort((a, b) => b.total - a.total)[0];

  const setoresComCobertura = setores.map((setor) => {
    const funcionariosDoSetor = funcionarios.filter(
      (funcionario) => funcionario.setor === setor.id,
    ).length;

    return {
      nome: setor.nome,
      ocupacao: funcionariosDoSetor,
      minimo: setor.minimoFuncionarios,
      status:
        funcionariosDoSetor >= setor.minimoFuncionarios
          ? "Atende ao mínimo"
          : "Abaixo do mínimo",
    };
  });

  return (
    <section className="report-page">
      <div className="summary-grid">
        <article className="summary-card">
          <span>Funcionários</span>
          <strong>{totalFuncionarios}</strong>
          <small>Colaboradores ativos</small>
        </article>
        <article className="summary-card">
          <span>Setores</span>
          <strong>{totalSetores}</strong>
          <small>Áreas em operação</small>
        </article>
        <article className="summary-card">
          <span>Turnos</span>
          <strong>{totalTurnos}</strong>
          <small>Configurações disponíveis</small>
        </article>
      </div>

      <div className="report-panels">
        <div className="table-panel">
          <div className="panel-header">
            <h2>Resumo de cobertura</h2>
          </div>

          <div className="report-summary-wrap">
            <div className="report-summary-card accent">
              <label>Cobertura atual</label>
              <strong>{coberturaAtual}%</strong>
              <small>
                {totalFuncionarios} de {coberturaMinima} vagas mínimas atendidas
              </small>
            </div>

            <div className="report-summary-card">
              <label>Turno mais usado</label>
              <strong>{turnoMaisUtilizado?.nome || "Nenhum"}</strong>
              <small>
                {turnoMaisUtilizado?.total || 0} colaboradores alocados
              </small>
            </div>
          </div>
        </div>

        <div className="table-panel">
          <div className="panel-header">
            <h2>Distribuição por setor</h2>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Setor</th>
                  <th>Ocupação</th>
                  <th>Mínimo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {setoresComCobertura.map((setor) => (
                  <tr key={setor.nome}>
                    <td>{setor.nome}</td>
                    <td>
                      {setor.ocupacao}/{setor.minimo}
                    </td>
                    <td>{setor.minimo}</td>
                    <td>
                      <span
                        className={`status ${
                          setor.status === "Atende ao mínimo"
                            ? "disponível"
                            : "em-pausa"
                        }`}
                      >
                        {setor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
