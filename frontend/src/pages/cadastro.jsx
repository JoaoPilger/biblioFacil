import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerLocal } from "../localAuth";

const TIPO_API = {
  Leitor: "leitor",
  Bibliotecário: "bibliotecario",
};

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    emailConfirm: "",
    password: "",
    passwordConfirm: "",
    tipo: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState("");
  const [step, setStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [stepError, setStepError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function goNext() {
    setStepError("");
    const nome = form.nome.trim();
    const email = form.email.trim();
    if (!nome) {
      setStepError("Informe seu nome completo.");
      return;
    }
    if (!isValidEmail(email)) {
      setStepError("Informe um e-mail válido.");
      return;
    }
    if (email !== form.emailConfirm.trim()) {
      setStepError("Os e-mails não coincidem.");
      return;
    }
    if (!form.tipo) {
      setStepError("Selecione o tipo de usuário.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (form.password.length < 8) {
      setSubmitError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setSubmitError("As senhas não coincidem.");
      return;
    }
    if (!termsAccepted) {
      setSubmitError("Aceite os termos para continuar.");
      return;
    }
    var tipo = TIPO_API[form.tipo];
    if (!tipo) {
      setSubmitError("Tipo de usuário inválido.");
      return;
    }
    var result = await registerLocal({
      nome: form.nome.trim(),
      email: form.email.trim(),
      password: form.password,
      tipo: tipo,
    });
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    if (result.token) {
      localStorage.setItem("biblioFacil_token", result.token);
    }
    localStorage.setItem("biblioFacil_user", JSON.stringify(result.user));
    navigate("/", { replace: true });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f0e8df;
          --card-bg: #ddd0c4;
          --card-inner: #cfc0b0;
          --border: #c5b09e;
          --input-bg: #e8ddd3;
          --input-border: #b8a898;
          --text-dark: #4a3728;
          --text-mid: #7a6555;
          --text-light: #9e8b7b;
          --accent: #694D40;
          --accent-hover: #6e2d1f;
          --accent-soft: #c27a60;
          --white: #fdf8f4;
          --green: #4a7a50;
          --shadow-deep: 0 8px 32px rgba(74,55,40,0.18);
        }

        .biblio-page {
          min-height: 100vh;
          background-color: var(--bg);
          background-image:
            radial-gradient(ellipse at 80% 10%, rgba(194,122,96,0.09) 0%, transparent 55%),
            radial-gradient(ellipse at 10% 90%, rgba(139,58,42,0.06) 0%, transparent 55%);
          font-family: "Fraunces", serif;
          display: flex;
          flex-direction: column;
        }

        .biblio-nav {
          background-color: var(--card-bg);
          padding: 14px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          box-shadow: 0 2px 8px rgba(74,55,40,0.08);
        }
        .biblio-logo {
          font-family: "Fraunces", serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-dark);
        }
        .biblio-nav-links { display: flex; gap: 28px; }
        .biblio-nav-links a {
          color: var(--text-mid);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          transition: color 0.2s;
        }
        .biblio-nav-links a:hover { color: var(--text-dark); }

        .biblio-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 20px 60px;
        }

        .cad-card {
          background: var(--card-bg);
          border-radius: 16px;
          box-shadow: var(--shadow-deep);
          width: 100%;
          max-width: 480px;
          border: 1px solid var(--border);
          overflow: hidden;
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cad-header {
          background: var(--card-inner);
          border-bottom: 1px solid var(--border);
          padding: 26px 32px 22px;
          text-align: center;
        }
        .cad-title {
          font-family: "Fraunces", serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 5px;
        }
        .cad-subtitle {
          font-size: 0.81rem;
          color: var(--text-light);
          font-weight: 300;
        }

        .cad-body {
          padding: 26px 32px 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .field-label {
          font-size: 0.77rem;
          font-weight: 500;
          color: var(--text-mid);
          letter-spacing: 0.04em;
        }
        .field-wrap { position: relative; }
        .field-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 8px;
          padding: 10px 14px;
          font-family: "Fraunces", serif;
          font-size: 0.87rem;
          color: var(--text-dark);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: var(--text-light); font-weight: 300; }
        .field-input:focus,
        .field-input.focused {
          border-color: var(--accent-soft);
          box-shadow: 0 0 0 3px rgba(194,122,96,0.18);
        }
        .field-input.error {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(139,58,42,0.12);
        }

        .password-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer;
          color: var(--text-light);
          font-size: 0.78rem;
          transition: color 0.2s;
        }
        .password-toggle:hover { color: var(--text-mid); }

        .tipo-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tipo-option {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--input-bg);
          border: 1.5px solid var(--input-border);
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .tipo-option.selected {
          border-color: var(--accent-soft);
          background: rgba(194,122,96,0.1);
        }
        .tipo-radio {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 1.5px solid var(--input-border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.2s;
        }
        .tipo-option.selected .tipo-radio {
          border-color: var(--accent-soft);
        }
        .tipo-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent-soft);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .tipo-option.selected .tipo-dot { opacity: 1; }
        .tipo-text {
          font-size: 0.82rem;
          color: var(--text-dark);
          font-weight: 400;
        }

        .hint {
          font-size: 0.72rem;
          color: var(--text-light);
          margin-top: 2px;
        }

        .strength-wrap {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .strength-bars {
          display: flex;
          gap: 4px;
        }
        .s-bar {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: var(--border);
          transition: background 0.3s;
        }
        .s-bar.filled-1 { background: var(--accent); }
        .s-bar.filled-2 { background: var(--accent-soft); }
        .s-bar.filled-3 { background: var(--green); }
        .strength-label {
          font-size: 0.7rem;
          color: var(--text-light);
        }

        .btn-row {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }
        .btn-secondary {
          flex: 1;
          background: transparent;
          color: var(--text-mid);
          border: 1.5px solid var(--border);
          border-radius: 8px;
          padding: 11px;
          font-family: "Fraunces", serif;
          font-size: 0.87rem;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-secondary:hover {
          border-color: var(--accent-soft);
          color: var(--text-dark);
        }
        .btn-primary {
          flex: 2;
          background: var(--accent);
          color: var(--white);
          border: none;
          border-radius: 8px;
          padding: 11px;
          font-family: "Fraunces", serif;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 3px 10px rgba(139,58,42,0.25);
        }
        .btn-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 5px 16px rgba(139,58,42,0.3);
        }
        .btn-primary:active { transform: translateY(0); }

        .login-prompt {
          text-align: center;
          font-size: 0.79rem;
          color: var(--text-light);
          margin-top: 4px;
        }
        .login-prompt a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .login-prompt a:hover { color: var(--accent-hover); }

        .terms-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 2px;
          cursor: pointer;
        }
        .terms-check {
          width: 15px; height: 15px;
          border: 1.5px solid var(--input-border);
          border-radius: 3px;
          background: var(--input-bg);
          flex-shrink: 0;
          margin-top: 1px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .terms-check.on {
          background: var(--accent-soft);
          border-color: var(--accent-soft);
        }
        .terms-text {
          font-size: 0.75rem;
          color: var(--text-light);
          line-height: 1.5;
        }
        .terms-text a {
          color: var(--accent-soft);
          text-decoration: none;
        }

        .form-error {
          font-size: 0.8rem;
          color: var(--accent);
          padding: 10px 12px;
          background: rgba(139,58,42,0.08);
          border-radius: 8px;
          border: 1px solid rgba(139,58,42,0.2);
        }
      `}</style>

      <div className="biblio-page">
        <nav className="biblio-nav">
          <Link to="/" className="biblio-logo" style={{ textDecoration: "none", color: "inherit" }}>
            BiblioFácil
          </Link>
          <div className="biblio-nav-links">
            <a href="#">Quem somos</a>
            <a href="#">Contato</a>
          </div>
        </nav>

        <main className="biblio-main">
          <div className="cad-card">
            <div className="cad-header">
              <h1 className="cad-title">Criar Conta</h1>
              <p className="cad-subtitle">Junte-se à BiblioFácil e gerencie seu acervo</p>
            </div>

            <div className="cad-body">
              {step === 1 ? (
                <>
                  {stepError ? <div className="form-error">{stepError}</div> : null}

                  <div className="field-group">
                    <label className="field-label" htmlFor="cad-nome">
                      Nome Completo
                    </label>
                    <input
                      id="cad-nome"
                      className={`field-input${focused === "nome" ? " focused" : ""}`}
                      type="text"
                      placeholder="Ex: Maria Silva"
                      value={form.nome}
                      onChange={(e) => set("nome", e.target.value)}
                      onFocus={() => setFocused("nome")}
                      onBlur={() => setFocused("")}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="cad-email">
                      E-mail
                    </label>
                    <input
                      id="cad-email"
                      className={`field-input${focused === "email" ? " focused" : ""}`}
                      type="email"
                      placeholder="Ex: maria@email.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused("")}
                      autoComplete="email"
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="cad-email2">
                      Confirmar E-mail
                    </label>
                    <input
                      id="cad-email2"
                      className={`field-input${
                        form.emailConfirm && form.email !== form.emailConfirm
                          ? " error"
                          : focused === "emailConfirm"
                            ? " focused"
                            : ""
                      }`}
                      type="email"
                      placeholder="Repita seu e-mail"
                      value={form.emailConfirm}
                      onChange={(e) => set("emailConfirm", e.target.value)}
                      onFocus={() => setFocused("emailConfirm")}
                      onBlur={() => setFocused("")}
                      autoComplete="email"
                    />
                    {form.emailConfirm && form.email !== form.emailConfirm ? (
                      <span className="hint" style={{ color: "var(--accent)" }}>
                        Os e-mails não coincidem
                      </span>
                    ) : null}
                  </div>

                  <div className="field-group">
                    <span className="field-label">Tipo de Usuário</span>
                    <div className="tipo-row">
                      {["Leitor", "Bibliotecário"].map((t) => (
                        <div
                          key={t}
                          className={`tipo-option${form.tipo === t ? " selected" : ""}`}
                          onClick={() => set("tipo", t)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              set("tipo", t);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="tipo-radio">
                            <div className="tipo-dot" />
                          </div>
                          <span className="tipo-text">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="btn-row">
                    <button className="btn-primary" type="button" onClick={goNext}>
                      Próximo →
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  {submitError ? <div className="form-error">{submitError}</div> : null}

                  <div className="field-group">
                    <label className="field-label" htmlFor="cad-pass">
                      Senha
                    </label>
                    <div className="field-wrap">
                      <input
                        id="cad-pass"
                        className={`field-input${focused === "password" ? " focused" : ""}`}
                        type={showPass ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        onFocus={() => setFocused("password")}
                        onBlur={() => setFocused("")}
                        style={{ paddingRight: 56 }}
                        autoComplete="new-password"
                        minLength={8}
                      />
                      <button
                        className="password-toggle"
                        onClick={() => setShowPass((p) => !p)}
                        type="button"
                      >
                        {showPass ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    {form.password.length > 0 ? (
                      (() => {
                        const len = form.password.length;
                        const strength = len < 6 ? 1 : len < 10 ? 2 : 3;
                        const labels = ["", "Fraca", "Média", "Forte"];
                        return (
                          <div className="strength-wrap">
                            <div className="strength-bars">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={`s-bar${i <= strength ? ` filled-${strength}` : ""}`}
                                />
                              ))}
                            </div>
                            <span className="strength-label">Força: {labels[strength]}</span>
                          </div>
                        );
                      })()
                    ) : null}
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="cad-pass2">
                      Confirmar Senha
                    </label>
                    <div className="field-wrap">
                      <input
                        id="cad-pass2"
                        className={`field-input${
                          form.passwordConfirm && form.password !== form.passwordConfirm
                            ? " error"
                            : focused === "passwordConfirm"
                              ? " focused"
                              : ""
                        }`}
                        type={showPass ? "text" : "password"}
                        placeholder="Repita sua senha"
                        value={form.passwordConfirm}
                        onChange={(e) => set("passwordConfirm", e.target.value)}
                        onFocus={() => setFocused("passwordConfirm")}
                        onBlur={() => setFocused("")}
                        style={{ paddingRight: 56 }}
                        autoComplete="new-password"
                      />
                    </div>
                    {form.passwordConfirm && form.password !== form.passwordConfirm ? (
                      <span className="hint" style={{ color: "var(--accent)" }}>
                        As senhas não coincidem
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="terms-row"
                    onClick={() => setTermsAccepted((v) => !v)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTermsAccepted((v) => !v);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={`terms-check${termsAccepted ? " on" : ""}`} />
                    <p className="terms-text">
                      Ao criar sua conta, você concorda com os{" "}
                      <a href="#" onClick={(e) => e.stopPropagation()}>
                        Termos de Uso
                      </a>{" "}
                      e a{" "}
                      <a href="#" onClick={(e) => e.stopPropagation()}>
                        Política de Privacidade
                      </a>{" "}
                      da BiblioFácil.
                    </p>
                  </div>

                  <div className="btn-row">
                    <button className="btn-secondary" type="button" onClick={() => setStep(1)}>
                      ← Voltar
                    </button>
                    <button className="btn-primary" type="submit">
                      Criar Conta
                    </button>
                  </div>
                </form>
              )}

              <p className="login-prompt">
                Já tem uma conta? <Link to="/login">Faça login</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
