const ACCOUNTS_KEY = "biblioFacil_accounts";

function loadAccounts() {
  try {
    var raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function nextId(accounts) {
  var max = 0;
  for (var i = 0; i < accounts.length; i++) {
    var id = accounts[i].id;
    if (typeof id === "number" && id > max) max = id;
  }
  return max + 1;
}

export function registerLocal(payload) {
  var nome = String(payload.nome || "").trim();
  var email = String(payload.email || "").trim().toLowerCase();
  var password = String(payload.password || "");
  var tipo = String(payload.tipo || "");

  if (!nome || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }
  if (tipo !== "leitor" && tipo !== "bibliotecario") {
    return { error: "Tipo de usuário inválido." };
  }

  var accounts = loadAccounts();
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].email === email) {
      return { error: "Este e-mail já está cadastrado." };
    }
  }

  var user = {
    id: nextId(accounts),
    nome: nome,
    email: email,
    tipo: tipo,
    password: password,
  };
  accounts.push(user);
  saveAccounts(accounts);

  return {
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
    },
  };
}

export function loginLocal(payload) {
  var email = String(payload.email || "").trim().toLowerCase();
  var password = String(payload.password || "");

  var accounts = loadAccounts();
  for (var i = 0; i < accounts.length; i++) {
    var a = accounts[i];
    if (a.email === email && a.password === password) {
      return {
        user: {
          id: a.id,
          nome: a.nome,
          email: a.email,
          tipo: a.tipo,
        },
      };
    }
  }
  return { error: "E-mail ou senha incorretos." };
}
