const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const express = require('express');

// Somente banco descartável: cada execução cria e remove seu próprio schema.
test('circulação com PostgreSQL real', { skip: !process.env.TEST_DATABASE_URL }, async (t) => {
  const schema = `circulacao_test_${crypto.randomBytes(8).toString('hex')}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db = new Pool({ connectionString: process.env.TEST_DATABASE_URL,
    options: `-c search_path=${schema} -c timezone=America/Sao_Paulo -c statement_timeout=10000`,
    application_name: schema, max: 12 });
  const dbPath = require.resolve('../src/config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
  const email = require('../src/services/emailService');
  for (const name of ['notifyReservaRegistrada', 'notifyRetiradaConfirmada', 'notifyDevolucaoConfirmada']) {
    email[name] = async () => ({ sent: false });
  }
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    await db.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  await db.query(fs.readFileSync(path.join(__dirname, '../data/init.sql'), 'utf8'));
  for (const name of fs.readdirSync(path.join(__dirname, '../migrations')).sort()) {
    await db.query(fs.readFileSync(path.join(__dirname, '../migrations', name), 'utf8'));
  }
  const app = express();
  app.use(express.json());
  app.use('/livros', require('../src/routes/books'));
  app.use('/circulacao', require('../src/routes/circulacao'));
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(route, user = 1, body, method = 'POST') {
    const response = await fetch(base + route, { method,
      headers: { Authorization: `Bearer test-${user}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  async function reset(copies = 1) {
    await db.query('TRUNCATE users, livros RESTART IDENTITY CASCADE');
    await db.query(`INSERT INTO users (nome,email,password_hash,tipo) VALUES
      ('Leitor A','a@example.test','fixture','leitor'),
      ('Leitor B','b@example.test','fixture','leitor'),
      ('Bibliotecário','c@example.test','fixture','bibliotecario')`);
    for (const id of [1, 2, 3]) await db.query(`INSERT INTO auth_sessions
      (id,user_id,token_hash,user_nome,user_email,user_tipo,expires_at)
      SELECT $1,id,$2,nome,email,tipo,CURRENT_TIMESTAMP + INTERVAL '1 hour' FROM users WHERE id=$3`,
      [crypto.randomUUID(), crypto.createHash('sha256').update(`test-${id}`).digest('hex'), id]);
    await db.query("INSERT INTO livros(titulo,autor,quantidade_exemplares) VALUES ('Livro','Autor',$1)", [copies]);
  }
  async function dates() {
    return (await db.query("SELECT CURRENT_DATE::text AS retirada, (CURRENT_DATE + 14)::text AS limite")).rows[0];
  }
  async function reserve(user = 1, extra = {}) {
    return request('/livros/1/reservar', user, { nome: 'Leitor', email: 'leitor@example.test', ...await dates(), ...extra });
  }
  async function snapshot() {
    return { livros: (await db.query('SELECT * FROM livros ORDER BY id')).rows,
      reservas: (await db.query('SELECT * FROM reservas ORDER BY id')).rows,
      emprestimos: (await db.query('SELECT * FROM emprestimos ORDER BY id')).rows };
  }
  async function loan() {
    assert.equal((await reserve()).status, 201);
    const result = await request('/circulacao/retiradas/1/confirmar', 3);
    assert.equal(result.status, 200);
    return result.body.emprestimo.id;
  }
  // Mantém os pedidos aguardando o mesmo lock antes de liberá-los, sem sleeps.
  async function competing(actions, ordered = false) {
    const lock = await db.connect();
    await lock.query('BEGIN');
    await lock.query('SELECT id FROM livros WHERE id=1 FOR UPDATE');
    const pending = [];
    async function waitLocks(count) {
      const deadline = Date.now() + 5000;
      while (true) {
        const { rows } = await admin.query("SELECT COUNT(*)::int AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'", [schema]);
        if (rows[0].n >= count) break;
        assert.ok(Date.now() < deadline, 'pedidos devem aguardar lock do livro');
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    try {
      for (const action of actions) {
        pending.push(action());
        if (ordered) await waitLocks(pending.length);
      }
      await waitLocks(actions.length);
    } finally { await lock.query('ROLLBACK'); lock.release(); }
    return Promise.all(pending);
  }

  await t.test('duas reservas simultâneas disputam o último exemplar', async () => {
    await reset();
    const results = await competing([() => reserve(1), () => reserve(2)]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const state = await snapshot();
    assert.equal(state.reservas.length, 1);
    assert.equal(state.emprestimos.length, 0);
    assert.equal(state.livros[0].status, 'indisponivel');
  });
  await t.test('múltiplos exemplares e duplicidade por leitor', async () => {
    await reset(3);
    assert.equal((await reserve()).status, 201);
    const before = await snapshot();
    assert.equal((await reserve()).status, 409);
    assert.deepEqual(await snapshot(), before);
    assert.equal((await reserve(2)).status, 201);
  });
  await t.test('reservas simultâneas respeitam quantidade e unicidade por leitor', async () => {
    await reset(2);
    let results = await competing([() => reserve(1), () => reserve(2)]);
    assert.deepEqual(results.map(r => r.status), [201, 201]);
    assert.equal((await snapshot()).reservas.length, 2);
    await reset(2);
    results = await competing([() => reserve(1), () => reserve(1)]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal((await snapshot()).reservas.length, 1);
  });
  await t.test('datas impossíveis, passadas e período maior que 14 dias são rejeitados', async () => {
    await reset();
    const date = (await db.query("SELECT (CURRENT_DATE-1)::text AS passada, (CURRENT_DATE+15)::text AS longa")).rows[0];
    const before = await snapshot();
    for (const extra of [{ retirada: '2099-02-31', limite: '2099-03-04' }, { retirada: date.passada }, { limite: date.longa }]) {
      assert.equal((await reserve(1, extra)).status, 400);
      assert.deepEqual(await snapshot(), before);
    }
  });
  await t.test('reserva → retirada única → duas renovações → devolução única', async () => {
    await reset();
    const id = await loan();
    const before = await snapshot();
    assert.equal((await request('/circulacao/retiradas/1/confirmar', 3)).status, 409);
    assert.deepEqual(await snapshot(), before);
    for (const n of [1, 2]) {
      const result = await request(`/livros/emprestimos/${id}/renovar`);
      assert.equal(result.status, 200);
      assert.equal(result.body.emprestimo.renovacoes, n);
      const { rows } = await db.query('SELECT data_devolucao_prevista::date = CURRENT_DATE + $1::int AS correto FROM emprestimos WHERE id=$2', [14 + 7*n, id]);
      assert.equal(rows[0].correto, true);
    }
    const limited = await snapshot();
    assert.equal((await request(`/livros/emprestimos/${id}/renovar`)).status, 409);
    assert.deepEqual(await snapshot(), limited);
    assert.equal((await request(`/circulacao/devolucoes/${id}/confirmar`, 3)).status, 200);
    const returned = await snapshot();
    assert.equal(returned.emprestimos[0].status, 'devolvido');
    assert.ok(returned.emprestimos[0].data_devolucao_real);
    assert.equal(returned.livros[0].status, 'disponivel');
    assert.equal((await request(`/circulacao/devolucoes/${id}/confirmar`, 3)).status, 409);
    assert.equal((await request(`/livros/emprestimos/${id}/renovar`)).status, 409);
    assert.deepEqual(await snapshot(), returned);
  });
  await t.test('outro leitor e reserva pendente impedem renovação sem alterar registros', async () => {
    await reset(2);
    const id = await loan();
    let before = await snapshot();
    assert.equal((await request(`/livros/emprestimos/${id}/renovar`, 2)).status, 403);
    assert.deepEqual(await snapshot(), before);
    assert.equal((await reserve(2)).status, 201);
    before = await snapshot();
    assert.equal((await request(`/livros/emprestimos/${id}/renovar`)).status, 409);
    assert.deepEqual(await snapshot(), before);
    const listing = await request('/livros/minhas-reservas', 1, undefined, 'GET');
    assert.equal(listing.body.emprestimos[0].pode_renovar, false);
  });
  await t.test('confirmações simultâneas não duplicam empréstimo nem devolução', async () => {
    await reset();
    await reserve();
    let results = await competing([1, 2].map(() => () => request('/circulacao/retiradas/1/confirmar', 3)));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    assert.equal((await snapshot()).emprestimos.length, 1);
    results = await competing([1, 2].map(() => () => request('/circulacao/devolucoes/1/confirmar', 3)));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    assert.equal((await snapshot()).livros[0].status, 'disponivel');
  });
  await t.test('renovações concorrentes respeitam o limite de duas', async () => {
    await reset();
    const id = await loan();
    assert.equal((await request(`/livros/emprestimos/${id}/renovar`)).status, 200);
    const results = await competing([1, 2].map(() => () => request(`/livros/emprestimos/${id}/renovar`)));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    assert.equal((await snapshot()).emprestimos[0].renovacoes, 2);
  });
  await t.test('renovação aguarda reserva concorrente e recusa conflito recém-confirmado', async () => {
    await reset(2);
    const id = await loan();
    const before = (await snapshot()).emprestimos;
    const results = await competing([() => reserve(2), () => request(`/livros/emprestimos/${id}/renovar`)], true);
    assert.deepEqual(results.map(r => r.status), [201, 409]);
    assert.deepEqual((await snapshot()).emprestimos, before);
  });
  await t.test('leitores não confirmam retirada nem devolução', async () => {
    await reset();
    await reserve();
    const before = await snapshot();
    assert.equal((await request('/circulacao/retiradas/1/confirmar')).status, 403);
    assert.equal((await request('/circulacao/devolucoes/1/confirmar')).status, 403);
    assert.deepEqual(await snapshot(), before);
  });
  await t.test('reserva expirada não vira empréstimo e limpeza libera disponibilidade', async () => {
    await reset();
    await reserve();
    await db.query("UPDATE reservas SET data_retirada=CURRENT_DATE-15, data_limite=CURRENT_DATE-1");
    const before = await snapshot();
    assert.equal((await request('/circulacao/retiradas/1/confirmar', 3)).status, 409);
    assert.deepEqual(await snapshot(), before);
    const result = await require('../src/services/reservaCleanupService').cancelarReservasExpiradas();
    assert.equal(result.canceladas, 1);
    assert.equal(result.livrosLiberados, 1);
    const state = await snapshot();
    assert.equal(state.reservas[0].status, 'cancelada');
    assert.equal(state.livros[0].status, 'disponivel');
    assert.equal((await require('../src/services/reservaCleanupService').cancelarReservasExpiradas()).canceladas, 0);
  });
  await t.test('limpeza preserva ocupação de empréstimos e reservas ainda pendentes', async () => {
    await reset(3);
    await loan();
    await reserve(2);
    await reserve(3);
    await db.query("UPDATE reservas SET data_retirada=CURRENT_DATE-15, data_limite=CURRENT_DATE-1 WHERE user_id=2");
    await require('../src/services/reservaCleanupService').cancelarReservasExpiradas();
    const state = await snapshot();
    assert.equal(state.livros[0].status, 'disponivel');
    assert.equal(state.emprestimos[0].status, 'ativo');
    assert.equal(state.reservas.find(r => r.user_id === 3).status, 'pendente');
  });
  await t.test('retirada futura e reserva sem leitor não criam empréstimos', async () => {
    await reset();
    const date = (await db.query("SELECT (CURRENT_DATE+1)::text AS retirada, (CURRENT_DATE+2)::text AS limite")).rows[0];
    await reserve(1, date);
    let before = await snapshot();
    assert.equal((await request('/circulacao/retiradas/1/confirmar', 3)).status, 409);
    assert.deepEqual(await snapshot(), before);
    await db.query('UPDATE reservas SET data_retirada=CURRENT_DATE, user_id=NULL');
    before = await snapshot();
    assert.equal((await request('/circulacao/retiradas/1/confirmar', 3)).status, 409);
    assert.deepEqual(await snapshot(), before);
  });
  await t.test('falha no serviço de e-mail não altera sucesso persistido', async () => {
    await reset();
    const names = ['notifyReservaRegistrada', 'notifyRetiradaConfirmada', 'notifyDevolucaoConfirmada'];
    const original = names.map(name => email[name]);
    try {
      for (const name of names) email[name] = async () => { throw new Error('notificação indisponível'); };
      const id = await loan();
      assert.equal((await request(`/circulacao/devolucoes/${id}/confirmar`, 3)).status, 200);
      assert.equal((await snapshot()).emprestimos[0].status, 'devolvido');
    } finally { names.forEach((name, index) => { email[name] = original[index]; }); }
  });
  await t.test('cancelar reserva preserva empréstimo de outro leitor', async () => {
    await reset(2);
    await loan();
    await reserve(2);
    assert.equal((await request('/livros/1/reserva/cancelar', 2)).status, 200);
    const state = await snapshot();
    assert.equal(state.emprestimos[0].status, 'ativo');
    assert.equal(state.livros[0].status, 'disponivel');
    assert.equal((await request('/livros/1/reserva/cancelar', 2)).status, 404);
  });
  await t.test('falha no banco desfaz reserva, retirada e devolução integralmente', async () => {
    await reset();
    await db.query(`CREATE FUNCTION falhar_status() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha de teste'; END $$`);
    async function failOperation(action) {
      await db.query('CREATE TRIGGER falha_status BEFORE UPDATE ON livros FOR EACH ROW EXECUTE FUNCTION falhar_status()');
      const before = await snapshot();
      try { assert.equal((await action()).status, 500); assert.deepEqual(await snapshot(), before); }
      finally { await db.query('DROP TRIGGER falha_status ON livros'); }
    }
    await failOperation(() => reserve());
    await reserve();
    const reserva = (await snapshot()).reservas[0].id;
    await failOperation(() => request(`/circulacao/retiradas/${reserva}/confirmar`, 3));
    const result = await request(`/circulacao/retiradas/${reserva}/confirmar`, 3);
    await failOperation(() => request(`/circulacao/devolucoes/${result.body.emprestimo.id}/confirmar`, 3));
    await db.query('DROP FUNCTION falhar_status()');
  });
});
