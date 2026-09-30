export function atribuirAtividadesFixas({
  atividades,
  ranking,
  funcionariosDisponiveis,
  resolucoes,
}) {
  const funcionariosPorId = new Map(
    funcionariosDisponiveis.map((funcionario) => [
      String(funcionario.id),
      funcionario,
    ]),
  );
  const usados = new Set();
  const atribuicoes = new Map();

  for (const atividade of atividades.filter((item) => item.tipo === "fixa")) {
    const candidatos = ranking
      .filter(
        (item) =>
          String(item.atividade_id) === String(atividade.id) &&
          !item.desconsiderado,
      )
      .sort((a, b) => a.posicao - b.posicao);

    const selecionado = candidatos.find((item) => {
      const funcionario = funcionariosPorId.get(String(item.funcionario_id));
      if (!funcionario || usados.has(String(funcionario.id))) return false;

      const resolucao = resolucoes[funcionario.id] || {};
      const setorId = resolucao.setor_id || funcionario.setor_id;
      return (
        atividade.todos_setores ||
        String(setorId) === String(atividade.setor_id)
      );
    });

    if (!selecionado) continue;

    const funcionarioId = String(selecionado.funcionario_id);
    usados.add(funcionarioId);
    atribuicoes.set(funcionarioId, [
      ...(atribuicoes.get(funcionarioId) || []),
      atividade,
    ]);
  }

  return atribuicoes;
}
