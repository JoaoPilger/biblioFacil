const db = require("../config/db");

/**
 * Cancela reservas pendentes que ultrapassaram a data limite (data_limite < CURRENT_DATE)
 * e libera os respectivos livros alterando seu status para 'disponivel'.
 */
const cancelarReservasExpiradas = async () => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Seleciona reservas pendentes expiradas
    const expiradas = await client.query(
      `SELECT id, livro_id 
       FROM reservas 
       WHERE status = 'pendente' AND data_limite < CURRENT_DATE
       FOR UPDATE`
    );

    if (expiradas.rows.length === 0) {
      await client.query("COMMIT");
      return { canceladas: 0, livrosLiberados: 0 };
    }

    const reservaIds = expiradas.rows.map((r) => r.id);
    const livroIds = Array.from(new Set(expiradas.rows.map((r) => r.livro_id)));

    // Marca reservas como canceladas
    await client.query(
      `UPDATE reservas 
       SET status = 'cancelada' 
       WHERE id = ANY($1::int[])`,
      [reservaIds]
    );

    // Libera livros cuja reserva expirou e que não possuem outra reserva pendente ativa
    const updLivros = await client.query(
      `UPDATE livros 
       SET status = 'disponivel' 
       WHERE id = ANY($1::int[]) 
         AND status = 'reservado'
         AND id NOT IN (SELECT livro_id FROM reservas WHERE status = 'pendente')`,
      [livroIds]
    );

    await client.query("COMMIT");

    console.log(
      `[Limpeza de Reservas] ${reservaIds.length} reserva(s) expirada(s) cancelada(s). ${updLivros.rowCount} livro(s) liberado(s).`
    );

    return {
      canceladas: reservaIds.length,
      livrosLiberados: updLivros.rowCount,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[Limpeza de Reservas] Erro ao cancelar reservas expiradas:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Inicia o agendamento contínuo em segundo plano.
 * @param {number} intervalMs - Intervalo em milissegundos (padrão: 1 hora)
 */
const iniciarRotinaLimpeza = (intervalMs = 60 * 60 * 1000) => {
  // Executa imediatamente na inicialização
  cancelarReservasExpiradas().catch((err) =>
    console.error("[Limpeza de Reservas] Falha na execução inicial:", err)
  );

  // Agenda execução periódica
  const timer = setInterval(() => {
    cancelarReservasExpiradas().catch((err) =>
      console.error("[Limpeza de Reservas] Falha na execução periódica:", err)
    );
  }, intervalMs);

  if (timer.unref) {
    timer.unref();
  }

  console.log(
    `[Limpeza de Reservas] Serviço de cancelamento automático iniciado (intervalo: ${intervalMs / 1000 / 60} min).`
  );
  return timer;
};

module.exports = {
  cancelarReservasExpiradas,
  iniciarRotinaLimpeza,
};
