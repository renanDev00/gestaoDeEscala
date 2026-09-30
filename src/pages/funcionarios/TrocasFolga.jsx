import { useState } from "react";
import { useSupabase } from "../../hooks/useSupabase";
import { isFolga } from "../../utils/domingoUtils";

const DIAS_SEMANA = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

function fmtDate(d) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function jsDayToBanco(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

const EMPTY = {
  funcionario_id: "",
  data_folga_origem: "",
  data_folga_destino: "",
  observacao: "",
};

export default function TrocasFolga() {
  const { data: trocasList, loading: tLoading, add, remove } = useSupabase("trocas_folga");
  const { data: funcionariosList, loading: fLoading } = useSupabase("funcionarios");
  const { data: grupoDomList, loading: gLoading } = useSupabase("grupo_domingo");

  const [form, setForm] = useState(EMPTY);
  const [showModal, setShowModal] = useState(false);
  const [filterFunc, setFilterFunc] = useState("");
  const [validacaoErro, setValidacaoErro] = useState("");

  const dataInicioGlobal = localStorage.getItem("data_inicio_domingo");

  const funcMap = Object.fromEntries((funcionariosList || []).map((f) => [f.id, f]));

  const handleOpen = () => { setForm(EMPTY); setValidacaoErro(""); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setValidacaoErro(""); };

  // Valida a data origem conforme o funcionário selecionado
  const validarOrigemFolga = (funcionarioId, dataOrigem) => {
    if (!funcionarioId || !dataOrigem) return "";
    const func = funcionariosList.find((f) => String(f.id) === String(funcionarioId));
    if (!func) return "";

    const dataObj = new Date(dataOrigem + "T00:00:00");
    const ehFolga = isFolga(func, dataObj, dataInicioGlobal, grupoDomList);

    if (!ehFolga) {
      const diaSemana = DIAS_SEMANA[jsDayToBanco(dataObj.getDay())];
      const folgaLabel = DIAS_SEMANA[func.dia_folga] || "não definida";
      return `⚠️ ${fmtDate(dataOrigem)} (${diaSemana}) não é um dia de folga de ${func.nome}. Folga padrão: ${folgaLabel}.`;
    }
    return "";
  };

  const handleFuncChange = (funcId) => {
    const novoForm = { ...form, funcionario_id: funcId };
    setForm(novoForm);
    setValidacaoErro(validarOrigemFolga(funcId, form.data_folga_origem));
  };

  const handleOrigemChange = (data) => {
    const novoForm = { ...form, data_folga_origem: data };
    setForm(novoForm);
    setValidacaoErro(validarOrigemFolga(form.funcionario_id, data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const erro = validarOrigemFolga(form.funcionario_id, form.data_folga_origem);
    if (erro) {
      setValidacaoErro(erro);
      return;
    }

    if (form.data_folga_origem === form.data_folga_destino) {
      alert("A data de origem e destino não podem ser iguais.");
      return;
    }

    await add({
      funcionario_id: form.funcionario_id,
      data_folga_origem: form.data_folga_origem,
      data_folga_destino: form.data_folga_destino,
      observacao: form.observacao || null,
    });
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Remover esta troca?")) await remove(id);
  };

  if (tLoading || fLoading || gLoading) return <div className="zone-loading">Carregando...</div>;

  const filtrada = trocasList
    .filter((t) => !filterFunc || String(t.funcionario_id) === filterFunc)
    .sort((a, b) => b.data_folga_origem.localeCompare(a.data_folga_origem));

  return (
    <div className="config-page">
      <div className="table-panel">
        <div className="panel-header">
          <h2>Trocas de Folga</h2>
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
            <button className="add-button" onClick={handleOpen}>+ Nova Troca</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Folga Original</th>
                <th>Folga Transferida Para</th>
                <th>Observação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrada.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center" }}>Nenhuma troca cadastrada.</td></tr>
              ) : filtrada.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{funcMap[item.funcionario_id]?.nome || "-"}</td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      background: "#fee2e2",
                      color: "#991b1b",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}>
                      {fmtDate(item.data_folga_origem)}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      background: "#dcfce7",
                      color: "#166534",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}>
                      {fmtDate(item.data_folga_destino)}
                    </span>
                  </td>
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
            <h3>Nova Troca de Folga</h3>
            <button className="close-button" onClick={handleClose}>&times;</button>
          </div>
          <form className="employee-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label style={{ gridColumn: "1 / -1" }}>
                Funcionário
                <select
                  required
                  value={form.funcionario_id}
                  onChange={(e) => handleFuncChange(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {funcionariosList.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </label>
              <label>
                Data da Folga Original
                <input
                  type="date" required
                  value={form.data_folga_origem}
                  onChange={(e) => handleOrigemChange(e.target.value)}
                />
              </label>
              <label>
                Nova Data de Folga
                <input
                  type="date" required
                  value={form.data_folga_destino}
                  onChange={(e) => setForm((p) => ({ ...p, data_folga_destino: e.target.value }))}
                />
              </label>

              {/* Mensagem de validação */}
              {form.funcionario_id && form.data_folga_origem && (
                <div style={{
                  gridColumn: "1 / -1",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: validacaoErro ? "#fee2e2" : "#dcfce7",
                  color: validacaoErro ? "#991b1b" : "#166534",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}>
                  {validacaoErro || `✅ Data confirmada como folga de ${funcMap[form.funcionario_id]?.nome || ""}. Prossiga!`}
                </div>
              )}

              <label style={{ gridColumn: "1 / -1" }}>
                Observação (opcional)
                <input
                  type="text"
                  value={form.observacao}
                  onChange={(e) => setForm((p) => ({ ...p, observacao: e.target.value }))}
                  placeholder="Motivo da troca..."
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={handleClose}>Cancelar</button>
              <button
                type="submit"
                className="primary-button"
                disabled={!!validacaoErro}
                style={{ opacity: validacaoErro ? 0.5 : 1 }}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
