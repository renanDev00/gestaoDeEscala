import { useState } from "react";
import { useSupabase } from "../../hooks/useSupabase";

function fmtDate(d) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const EMPTY = {
  funcionario_id: "",
  turno_id: "",
  setor_id: "",
  data_inicio: "",
  data_fim: "",
  observacao: "",
};

export default function MudancasTurnoSetor() {
  const { data: lista, loading: lLoading, add, remove } = useSupabase("mudancas_turno_setor");
  const { data: funcionariosList, loading: fLoading } = useSupabase("funcionarios");
  const { data: turnosList, loading: tLoading } = useSupabase("turnos");
  const { data: setoresList, loading: sLoading } = useSupabase("setores");

  const [form, setForm] = useState(EMPTY);
  const [showModal, setShowModal] = useState(false);
  const [filterFunc, setFilterFunc] = useState("");

  const handleOpen = () => { setForm(EMPTY); setShowModal(true); };
  const handleClose = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.turno_id && !form.setor_id) {
      alert("Informe ao menos um novo turno ou setor.");
      return;
    }
    if (new Date(form.data_fim) < new Date(form.data_inicio)) {
      alert("A data fim não pode ser anterior à data início.");
      return;
    }
    await add({
      funcionario_id: form.funcionario_id,
      turno_id: form.turno_id || null,
      setor_id: form.setor_id || null,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      observacao: form.observacao || null,
    });
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Remover esta mudança?")) await remove(id);
  };

  if (lLoading || fLoading || tLoading || sLoading) return <div className="zone-loading">Carregando...</div>;

  const funcMap = Object.fromEntries(funcionariosList.map((f) => [f.id, f]));
  const turnoMap = Object.fromEntries(turnosList.map((t) => [t.id, t]));
  const setorMap = Object.fromEntries(setoresList.map((s) => [s.id, s]));

  const filtrada = lista
    .filter((item) => !filterFunc || String(item.funcionario_id) === filterFunc)
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  return (
    <div className="config-page">
      <div className="table-panel">
        <div className="panel-header">
          <h2>Mudanças de Turno / Setor</h2>
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
            <button className="add-button" onClick={handleOpen}>+ Nova Mudança</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Novo Turno</th>
                <th>Novo Setor</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Observação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrada.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center" }}>Nenhuma mudança cadastrada.</td></tr>
              ) : filtrada.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{funcMap[item.funcionario_id]?.nome || "-"}</td>
                  <td>{turnoMap[item.turno_id]?.nome || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>{setorMap[item.setor_id]?.nome || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>{fmtDate(item.data_inicio)}</td>
                  <td>{fmtDate(item.data_fim)}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{item.observacao || "-"}</td>
                  <td>
                    <button className="btn delete" onClick={() => handleDelete(item.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={handleClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Nova Mudança de Turno / Setor</h3>
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
              <label>
                Novo Turno (opcional)
                <select
                  value={form.turno_id}
                  onChange={(e) => setForm((p) => ({ ...p, turno_id: e.target.value }))}
                >
                  <option value="">Sem mudança de turno</option>
                  {turnosList.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </label>
              <label>
                Novo Setor (opcional)
                <select
                  value={form.setor_id}
                  onChange={(e) => setForm((p) => ({ ...p, setor_id: e.target.value }))}
                >
                  <option value="">Sem mudança de setor</option>
                  {setoresList.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
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
                  placeholder="Motivo da mudança..."
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
