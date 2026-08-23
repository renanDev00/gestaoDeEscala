const fluxo = [];

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
};

export const limparFluxo = () => {
  fluxo.length = 0;
};

export default fluxo;
