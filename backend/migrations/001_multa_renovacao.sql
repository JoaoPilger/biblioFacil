-- Migration 001: Suporte a Multas e Renovações de Empréstimos
-- Adicionada em: 2026-08-09

-- 1. Tabela de configuração de multa (permite ajuste sem alterar código)
CREATE TABLE IF NOT EXISTS config_multa (
  chave   VARCHAR(50)   PRIMARY KEY,
  valor   NUMERIC(10,2) NOT NULL
);

-- Valor padrão: R$ 0,50 por dia de atraso
INSERT INTO config_multa (chave, valor)
VALUES ('multa_diaria', 0.50)
ON CONFLICT (chave) DO NOTHING;

-- 2. Coluna de controle de renovações nos empréstimos
ALTER TABLE emprestimos
  ADD COLUMN IF NOT EXISTS renovacoes INT NOT NULL DEFAULT 0;
