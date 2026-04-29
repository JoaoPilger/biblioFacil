-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'bibliotecario')),
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