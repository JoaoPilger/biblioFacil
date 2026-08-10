-- Migration 002: Suporte a Múltiplos Exemplares por Livro
-- Adicionada em: 2026-08-09

ALTER TABLE livros
  ADD COLUMN IF NOT EXISTS quantidade_exemplares INT NOT NULL DEFAULT 1;
