const db = require("../config/db");
const emailService = require("./emailService");

const DIAS_ALERTA_PROXIMO = Number(process.env.EMAIL_DIAS_ALERTA_VENCIMENTO) || 2;

async function jaEnviou(tipo, { userId, emprestimoId, reservaId }) {
  const params = [tipo, userId];
  let query = `SELECT 1 FROM email_notificacoes WHERE tipo = $1 AND user_id = $2`;

  if (emprestimoId) {
    params.push(emprestimoId);
    query += ` AND emprestimo_id = $${params.length}`;
  }
  if (reservaId) {
    params.push(reservaId);
    query += ` AND reserva_id = $${params.length}`;
  }

  query += " LIMIT 1";
  const result = await db.query(query, params);
  return result.rows.length > 0;
}

async function registrarEnvio(tipo, { userId, emprestimoId, reservaId }) {
  await db.query(
    `INSERT INTO email_notificacoes (user_id, emprestimo_id, reserva_id, tipo)
     VALUES ($1, $2, $3, $4)`,
    [userId, emprestimoId || null, reservaId || null, tipo]
  );
}

async function processarAlertasVencimento() {
  if (!emailService.isConfigured()) {
    return { proximos: 0, atrasados: 0 };
  }

  let proximos = 0;
  let atrasados = 0;

  try {
  const proximosResult = await db.query(
    `SELECT e.id AS emprestimo_id, e.user_id, e.data_devolucao_prevista,
            u.nome, u.email, l.titulo AS titulo_livro,
            (e.data_devolucao_prevista::date - CURRENT_DATE) AS dias_restantes
     FROM emprestimos e
     JOIN users u ON u.id = e.user_id
     JOIN livros l ON l.id = e.livro_id
     WHERE e.status = 'ativo'
       AND e.data_devolucao_prevista::date >= CURRENT_DATE
       AND e.data_devolucao_prevista::date <= CURRENT_DATE + $1::int`,
    [DIAS_ALERTA_PROXIMO]
  );

  for (const row of proximosResult.rows) {
    const enviado = await jaEnviou("vencimento_proximo", {
      userId: row.user_id,
      emprestimoId: row.emprestimo_id,
    });
    if (enviado) continue;

    const result = await emailService.notifyVencimentoProximo({
      email: row.email,
      nome: row.nome,
      tituloLivro: row.titulo_livro,
      dataDevolucao: row.data_devolucao_prevista,
      diasRestantes: Number(row.dias_restantes),
    });

    if (result.sent) {
      await registrarEnvio("vencimento_proximo", {
        userId: row.user_id,
        emprestimoId: row.emprestimo_id,
      });
      proximos++;
    }
  }

  const atrasadosResult = await db.query(
    `SELECT e.id AS emprestimo_id, e.user_id, e.data_devolucao_prevista,
            u.nome, u.email, l.titulo AS titulo_livro,
            (CURRENT_DATE - e.data_devolucao_prevista::date) AS dias_atraso
     FROM emprestimos e
     JOIN users u ON u.id = e.user_id
     JOIN livros l ON l.id = e.livro_id
     WHERE e.status = 'ativo'
       AND e.data_devolucao_prevista::date < CURRENT_DATE`
  );

  for (const row of atrasadosResult.rows) {
    const enviado = await jaEnviou("vencimento_atrasado", {
      userId: row.user_id,
      emprestimoId: row.emprestimo_id,
    });
    if (enviado) continue;

    const result = await emailService.notifyVencimentoAtrasado({
      email: row.email,
      nome: row.nome,
      tituloLivro: row.titulo_livro,
      dataDevolucao: row.data_devolucao_prevista,
      diasAtraso: Number(row.dias_atraso),
    });

    if (result.sent) {
      await registrarEnvio("vencimento_atrasado", {
        userId: row.user_id,
        emprestimoId: row.emprestimo_id,
      });
      atrasados++;
    }
  }

  if (proximos > 0 || atrasados > 0) {
    console.log(`[Notificações] Vencimento: ${proximos} próximo(s), ${atrasados} atrasado(s).`);
  }

  return { proximos, atrasados };
  } catch (error) {
    console.error("[Notificações] Erro ao processar alertas de vencimento:", error.message);
    return { proximos: 0, atrasados: 0, error: error.message };
  }
}

function iniciarRotinaNotificacoes(intervalMs = 60 * 60 * 1000) {
  processarAlertasVencimento().catch((err) =>
    console.error("[Notificações] Falha na execução inicial:", err)
  );

  const timer = setInterval(() => {
    processarAlertasVencimento().catch((err) =>
      console.error("[Notificações] Falha na execução periódica:", err)
    );
  }, intervalMs);

  if (timer.unref) timer.unref();

  console.log(
    `[Notificações] Serviço de alertas de vencimento iniciado (intervalo: ${intervalMs / 1000 / 60} min).`
  );
  return timer;
}

module.exports = {
  processarAlertasVencimento,
  iniciarRotinaNotificacoes,
  registrarEnvio,
  jaEnviou,
};
