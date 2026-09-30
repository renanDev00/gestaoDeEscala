import { useState } from "react";
import { useSupabase } from "../../hooks/useSupabase";

const TIPOS = [
  { value: "licenca_medica", label: "Licença Médica" },
  { value: "afastamento", label: "Afastamento" },
  { value: "folga", label: "Folga Extra" },
  { value: "ferias", label: "Férias" },
];

const TIPO_CORES = {
  licenca_medica: { bg: "#fef3c7", color: "#92400e" },
  afastamento:    { bg: "#fee2e2", color: "#991b1b" },
  folga:          { bg: "#dcfce7", color: "#166534" },
  ferias:         { bg: "#ede9fe", color: "#5b21b6" },
};

function fmtDate(d) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const EMPTY = {
  funcionario_id: "",
  tipo: "licenca_medica",
  data_inicio: "",
  data_fim: "",
  observacao: "",
};

export default function Ausencias() {
  const { data: ausenciasList, loading: aLoading, add, remove } = useSupabase("ausencias");
  const { data: funcionariosList, loading: fLoading } = useSupabase("funcionarios");

  const [form, setForm] = useState(EMPTY);
  const [showModal, setShowModal] = useState(false);
  const [filterFunc, setFilterFunc] = useState("");

  const handleOpen = () => { setForm(EMPTY); setShowModal(true); };
  const handleClose = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.data_fim) < new Date(form.data_inicio)) {
      alert("A data fim não pode ser anterior à data início.");
      return;
    }
    await add({
      funcionario_id: form.funcionario_id,
      tipo: form.tipo,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      observacao: form.observacao || null,
    });
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Remover esta ausência?")) await remove(id);
  };

  if (aLoading || fLoading) return <div className="zone-loading">Carregando...</div>;

  const funcMap = Object.fromEntries(funcionariosList.map((f) => [f.id, f]));

  const lista = ausenciasList
    .filter((a) => !filterFunc || String(a.funcionario_id) === filterFunc)
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  return (
    <div className="config-page">
      <div className="table-panel">
        <div className="panel-header">
          <h2>Ausências</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              className="zone-date-input"
              value={filterFunc}
              onChange={(e) => setFilterFunc(e.target.value)}
              style={{ padding: "8px 12px" }}
            >
              <option value="">Todos os funcionários</option>
              {funcionariosList.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            <button className="add-button" onClick={handleOpen}>+ Nova Ausência</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Tipo</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Observação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center" }}>Nenhuma ausência cadastrada.</td></tr>
              ) : lista.map((a) => {
                const tipoInfo = TIPOS.find((t) => t.value === a.tipo);
                const cor = TIPO_CORES[a.tipo] || {};
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{funcMap[a.funcionario_id]?.nome || "-"}</td>
                    <td>
                      <span className="status" style={{ background: cor.bg, color: cor.color }}>
                        {tipoInfo?.label || a.tipo}
                      </span>
                    </td>
                    <td>{fmtDate(a.data_inicio)}</td>
                    <td>{fmtDate(a.data_fim)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{a.observacao || "-"}</td>
                    <td>
                      <button className="btn delete" onClick={() => handleDelete(a.id)}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={handleClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Nova Ausência</h3>
            <button className="close-button" onClick={handleClose}>&times;</button>
          </div>
          <form className="employee-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label style={{ gridColumn: "1 / -1" }}>
                Funcionário
                <select
                  required
                  value={form.funcionario_id}
                  onChange={(e) => setForm((p) => ({ ...p, funcionario_id: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  {funcionariosList.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Tipo
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Data Início
                <input
                  type="date" required
                  value={form.data_inicio}
                  onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))}
                />
              </label>
              <label>
                Data Fim
                <input
                  type="date" required
                  value={form.data_fim}
                  onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Observação (opcional)
                <input
                  type="text"
                  value={form.observacao}
                  onChange={(e) => setForm((p) => ({ ...p, observacao: e.target.value }))}
                  placeholder="Ex: CID, motivo..."
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={handleClose}>Cancelar</button>
              <button type="submit" className="primary-button">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
