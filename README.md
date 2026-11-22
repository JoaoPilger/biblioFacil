# BiblioFácil

Aplicação web para gerenciamento de biblioteca: catálogo de livros, leitores, reservas, empréstimos e devoluções.

## Requisitos

- Node.js 20 ou superior e npm
- PostgreSQL 14 ou superior

## Configuração do banco de dados

Crie o banco e aplique a estrutura inicial:

```powershell
createdb -U postgres bibliofacil
psql -U postgres -d bibliofacil -f backend/data/init.sql
```

Configure as variáveis de conexão em `backend/.env`:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=bibliofacil
DB_USER=postgres
DB_PASSWORD=sua_senha
```

Como alternativa, configure `DATABASE_URL`:

```dotenv
DATABASE_URL=postgres://postgres:sua_senha@localhost:5432/bibliofacil
```

## Instalação e execução

Instale e inicie o backend:

```powershell
cd backend
npm install
npm run migrate
npm start
```

O servidor inicia por padrão em `http://localhost:3000`.

Em outro terminal, instale e inicie o frontend:

```powershell
cd frontend
npm install
npm run dev
```

O Vite informa o endereço local da interface, normalmente `http://localhost:5173`. A URL da API pode ser configurada pela variável `VITE_API_URL`; sem ela, o frontend usa `http://localhost:3000`.

## Contas e permissões

O cadastro público cria exclusivamente contas de leitor. O perfil é definido no backend e não pode ser alterado enviando outro valor no campo `tipo`.

Para criar o primeiro bibliotecário, uma pessoa com acesso ao servidor e ao banco executa no diretório `backend`:

```powershell
npm run create-bibliotecario -- "Nome do Bibliotecário" "bibliotecario@exemplo.com"
```

O comando solicita a senha sem exibi-la no terminal. Após a criação da primeira conta, bibliotecários autenticados podem cadastrar outros pela rota `POST /users/bibliotecarios`. A rota exige sessão e perfil de bibliotecário; leitores e pessoas não autenticadas não têm permissão.

## Segurança

- Senhas novas são armazenadas com bcrypt; hashes SHA-256 antigos são atualizados após um login válido.
- O upload de capas aceita PNG e JPEG, valida o tipo declarado e a assinatura do conteúdo, e limita o tamanho a 5 MB.
- O cadastro público não concede permissões administrativas.

## Comandos disponíveis

Backend:

```powershell
npm start
npm run migrate
npm run create-bibliotecario -- "Nome" "email@exemplo.com"
npm test
```

Frontend:

```powershell
npm run dev
npm run build
npm run lint
```

## Testes de reservas e empréstimos

A suíte de circulação usa PostgreSQL real e as rotas HTTP, incluindo autenticação
e permissões. Aponte `TEST_DATABASE_URL` para um banco **descartável de testes**
(PostgreSQL 14 ou superior), com permissão para criar schemas:

```powershell
cd backend
$env:TEST_DATABASE_URL = "postgresql://localhost/bibliofacil_test"
npm test
```

Configure a autenticação local do PostgreSQL para o usuário que executa os testes.
A suíte cria um schema aleatório, aplica `data/init.sql` e as migrations nesse
schema e o remove ao terminar. Os testes de e-mail usam um serviço simulado e não
enviam mensagens. Sem `TEST_DATABASE_URL`, somente a suíte de circulação é marcada
como ignorada; os outros testes continuam executando.

São verificados:

- Disputa simultânea pelo último exemplar: uma reserva aceita (`201`) e uma
  recusada (`409`), sem exceder a quantidade disponível.
- Múltiplos exemplares e bloqueio de reservas duplicadas pelo mesmo leitor.
- Datas válidas, retirada a partir de hoje e período de até 14 dias.
- Retirada dentro do período da reserva, com leitor válido, e conversão única em
  empréstimo, inclusive com confirmações simultâneas.
- Renovação somente pelo dono de empréstimo ativo, até duas vezes, de sete dias
  cada, sem reserva pendente de outro leitor. Rejeições preservam prazo e contador.
- Devolução única, cancelamento e expiração de reservas, recalculando a
  disponibilidade a partir das reservas pendentes e empréstimos ativos.
- Rollback integral após falhas de banco e sucesso preservado quando o serviço
  de e-mail falha.

As alterações de circulação bloqueiam primeiro o livro e depois a reserva ou o
empréstimo. A contagem de ocupação ocorre em outra consulta, após adquirir o lock,
para observar operações recém-confirmadas conforme o isolamento
[READ COMMITTED do PostgreSQL](https://www.postgresql.org/docs/14/transaction-iso.html).
As regras atuais não incluem bloqueio de renovação por atraso; esta alteração
preserva essa política.
