/**
 * Inicializa localStorage com dados dos modelos se estiver vazio
 * @param {string} key - Chave do localStorage
 * @param {Array} defaultData - Dados padrão (modelos)
 * @returns {Array} Dados do localStorage ou dados padrão
 */
export const initializeStorage = (key, defaultData) => {
  const stored = localStorage.getItem(key);

  if (stored === null) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Erro ao parsear ${key} do localStorage:`, error);
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
};

/**
 * Salva dados no localStorage
 * @param {string} key - Chave do localStorage
 * @param {Array} data - Dados a serem salvos
 */
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
  }
};

/**
 * Recupera dados do localStorage
 * @param {string} key - Chave do localStorage
 * @returns {Array|null} Dados do localStorage ou null
 */
export const getFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Erro ao recuperar ${key} do localStorage:`, error);
    return null;
  }
};
