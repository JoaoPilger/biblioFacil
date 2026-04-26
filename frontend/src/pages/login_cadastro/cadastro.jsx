import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerLocal } from "../../localAuth";
import "./Cadastro.css";

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
    localStorage.setItem("biblioFacil_user", JSON.stringify(result.user));
    navigate("/", { replace: true });
  }

  return (
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
  );
}