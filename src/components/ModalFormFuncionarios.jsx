function ModalFormFuncionarios() {
  return (
    <div
      className="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <h3 id="modal-title">Adicionar funcionário</h3>
        <button
          type="button"
          className="close-button"
          onClick={() => setIsModalOpen(false)}
          aria-label="Fechar modal"
        >
          ×
        </button>
      </div>

      <form className="employee-form">
        <div className="form-grid">
          <label>
            Nome
            <input type="text" placeholder="Digite o nome" />
          </label>
          <label>
            Folga
            <input type="text" placeholder="Ex: Segunda-feira" />
          </label>
          <label>
            Setor
            <input type="text" placeholder="Digite o setor" />
          </label>
          <label>
            Turno
            <select defaultValue="">
              <option value="" disabled>
                Selecione o turno
              </option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>
          </label>
          <label>
            Grupo Dom.
            <select defaultValue="">
              <option value="" disabled>
                Selecione o grupo
              </option>
              <option value="Grupo A">Grupo A</option>
              <option value="Grupo B">Grupo B</option>
              <option value="Grupo C">Grupo C</option>
              <option value="Grupo D">Grupo D</option>
            </select>
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button type="submit" className="primary-button">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModalFormFuncionarios;
