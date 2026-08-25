import { initializeStorage, saveToStorage } from "../utils/storage";

const fluxo = initializeStorage("fluxo", []);

export const atualizarFluxo = (novosDias = []) => {
  fluxo.length = 0;
  fluxo.push(
    ...novosDias.map((dia) => ({
      dia: dia?.dia || "",
      valores: Array.isArray(dia?.valores)
        ? dia.valores.map((item) => ({
            hora: item?.hora || "",
            valor: item?.valor ?? 0,
          }))
        : [],
    })),
  );

  try {
    saveToStorage("fluxo", fluxo);
  } catch (e) {
    // silent
  }
};

export const limparFluxo = () => {
  fluxo.length = 0;
  try {
    saveToStorage("fluxo", fluxo);
  } catch (e) {
    // silent
  }
};

export default fluxo;
