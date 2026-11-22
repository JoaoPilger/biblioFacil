// Todos os escritores da circulação bloqueiam o livro antes da reserva/empréstimo.
// Contagens devem ser consultadas em uma instrução posterior ao lock: em READ
// COMMITTED, a consulta que esperou pelo lock ainda usa seu snapshot anterior.
async function bloquearLivro(client, livroId) {
  return client.query('SELECT id FROM livros WHERE id = $1 FOR UPDATE', [livroId]);
}

async function atualizarDisponibilidade(client, livroId) {
  return client.query(
    `UPDATE livros SET status = CASE
       WHEN COALESCE(quantidade_exemplares, 1) > (
         (SELECT COUNT(*) FROM reservas WHERE livro_id = $1 AND status = 'pendente') +
         (SELECT COUNT(*) FROM emprestimos WHERE livro_id = $1 AND status = 'ativo')
       ) THEN 'disponivel' ELSE 'indisponivel' END
     WHERE id = $1 RETURNING status`, [livroId]
  );
}

module.exports = { bloquearLivro, atualizarDisponibilidade };
