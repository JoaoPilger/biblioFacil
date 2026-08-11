-- Permite status 'indisponivel' usado pelo código quando exemplares esgotam
ALTER TABLE livros DROP CONSTRAINT IF EXISTS livros_status_check;
ALTER TABLE livros ADD CONSTRAINT livros_status_check
  CHECK (status IN ('disponivel', 'emprestado', 'reservado', 'indisponivel'));
