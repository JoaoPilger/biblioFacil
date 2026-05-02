-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'leitor' CHECK (tipo IN ('leitor', 'bibliotecario')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE LIVROS (Exemplo para o BiblioFácil)
CREATE TABLE IF NOT EXISTS livros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    ano_publ INTEGER,
    edicao INTEGER,
    editora VARCHAR(255),
    genero VARCHAR(50),
    isbn VARCHAR(20) UNIQUE,
    paginas INTEGER,
    sinopse TEXT,
    capa_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'emprestado', 'reservado'))
);

-- 3. TABELA DE EMPRÉSTIMOS (Relacionando usuários e livros)
CREATE TABLE IF NOT EXISTS emprestimos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    livro_id INTEGER REFERENCES livros(id) ON DELETE CASCADE,
    data_emprestimo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_devolucao_prevista TIMESTAMP WITH TIME ZONE NOT NULL,
    data_devolucao_real TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'devolvido'))
);

-- Criar alguns índices para buscas rápidas (Performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros(titulo);

-- 4. RESERVAS (pedido de retirada / período reservado)
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    livro_id INTEGER NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    data_retirada DATE NOT NULL,
    data_limite DATE NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservas_livro ON reservas(livro_id);
CREATE INDEX IF NOT EXISTS idx_reservas_user ON reservas(user_id);

-- 5. SESSÕES (token/sessão armazenado no banco; removido ao deslogar)
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_nome VARCHAR(120) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_tipo VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);