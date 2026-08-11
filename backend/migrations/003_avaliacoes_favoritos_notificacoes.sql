-- Avaliações de livros (1 avaliação por usuário/livro)
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    livro_id INTEGER NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
    nota SMALLINT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, livro_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_livro ON avaliacoes(livro_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_user ON avaliacoes(user_id);

-- Favoritos / lista de desejos
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    livro_id INTEGER NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, livro_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_user ON favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_livro ON favoritos(livro_id);

-- Controle de e-mails enviados (evita duplicatas)
CREATE TABLE IF NOT EXISTS email_notificacoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emprestimo_id INTEGER REFERENCES emprestimos(id) ON DELETE CASCADE,
    reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
    tipo VARCHAR(40) NOT NULL CHECK (tipo IN (
        'vencimento_proximo',
        'vencimento_atrasado',
        'reserva_registrada',
        'retirada_confirmada',
        'devolucao_confirmada'
    )),
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_notif_user ON email_notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notif_emprestimo ON email_notificacoes(emprestimo_id);
