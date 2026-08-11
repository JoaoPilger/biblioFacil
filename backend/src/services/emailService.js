const nodemailer = require("nodemailer");

let transporter = null;

function isConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!to || !subject) return { sent: false, reason: "missing_params" };

  const transport = getTransporter();
  if (!transport) {
    console.warn("[Email] SMTP não configurado. E-mail não enviado:", subject);
    return { sent: false, reason: "smtp_not_configured" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await transport.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (error) {
    console.error("[Email] Erro ao enviar:", error.message);
    return { sent: false, reason: error.message };
  }
}

function formatDateBr(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

async function notifyReservaRegistrada({ email, nome, tituloLivro, dataRetirada, dataLimite }) {
  const subject = `Reserva confirmada — ${tituloLivro}`;
  const text = [
    `Olá, ${nome}!`,
    "",
    `Sua reserva do livro "${tituloLivro}" foi registrada com sucesso.`,
    `Retirada prevista: ${formatDateBr(dataRetirada)}`,
    `Prazo limite: ${formatDateBr(dataLimite)}`,
    "",
    "Apresente-se na biblioteca no período reservado para retirar o exemplar.",
    "",
    "BiblioFácil",
  ].join("\n");

  return sendEmail({ to: email, subject, text });
}

async function notifyRetiradaConfirmada({ email, nome, tituloLivro, dataDevolucao }) {
  const subject = `Retirada confirmada — ${tituloLivro}`;
  const text = [
    `Olá, ${nome}!`,
    "",
    `A retirada do livro "${tituloLivro}" foi confirmada.`,
    `Devolução prevista: ${formatDateBr(dataDevolucao)}`,
    "",
    "Boa leitura!",
    "",
    "BiblioFácil",
  ].join("\n");

  return sendEmail({ to: email, subject, text });
}

async function notifyDevolucaoConfirmada({ email, nome, tituloLivro }) {
  const subject = `Devolução confirmada — ${tituloLivro}`;
  const text = [
    `Olá, ${nome}!`,
    "",
    `A devolução do livro "${tituloLivro}" foi registrada com sucesso.`,
    "Obrigado por utilizar a BiblioFácil!",
    "",
    "BiblioFácil",
  ].join("\n");

  return sendEmail({ to: email, subject, text });
}

async function notifyVencimentoProximo({ email, nome, tituloLivro, dataDevolucao, diasRestantes }) {
  const subject = `Devolução próxima — ${tituloLivro}`;
  const text = [
    `Olá, ${nome}!`,
    "",
    `O prazo de devolução do livro "${tituloLivro}" está próximo.`,
    `Devolução prevista: ${formatDateBr(dataDevolucao)} (${diasRestantes} dia(s) restante(s)).`,
    "",
    "Evite multas devolvendo o exemplar dentro do prazo.",
    "",
    "BiblioFácil",
  ].join("\n");

  return sendEmail({ to: email, subject, text });
}

async function notifyVencimentoAtrasado({ email, nome, tituloLivro, dataDevolucao, diasAtraso }) {
  const subject = `Empréstimo em atraso — ${tituloLivro}`;
  const text = [
    `Olá, ${nome}!`,
    "",
    `O empréstimo do livro "${tituloLivro}" está em atraso.`,
    `Devolução prevista: ${formatDateBr(dataDevolucao)} (${diasAtraso} dia(s) de atraso).`,
    "",
    "Por favor, devolva o exemplar o quanto antes para evitar multas adicionais.",
    "",
    "BiblioFácil",
  ].join("\n");

  return sendEmail({ to: email, subject, text });
}

module.exports = {
  isConfigured,
  sendEmail,
  notifyReservaRegistrada,
  notifyRetiradaConfirmada,
  notifyDevolucaoConfirmada,
  notifyVencimentoProximo,
  notifyVencimentoAtrasado,
};
