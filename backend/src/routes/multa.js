const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /multa/config
 * Retorna a configuração atual de multa diária (público — sem autenticação).
 * Resposta: { multa_diaria: 0.50 }
 */
router.get("/config", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT chave, valor FROM config_multa"
    );
    const config = {};
    result.rows.forEach((row) => {
      config[row.chave] = parseFloat(row.valor);
    });
    res.json(config);
  } catch (error) {
    console.error("Erro ao buscar configuração de multa:", error);
    res.status(500).json({ error: "Erro ao buscar configuração de multa." });
  }
});

module.exports = router;
