import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginLocal } from "../localAuth";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    var result = await loginLocal({ email: email.trim(), password });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.token) {
      localStorage.setItem("biblioFacil_token", result.token);
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
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">Bem-vindo de volta</h1>
              <p className="login-subtitle">Acesse sua conta para continuar</p>
            </div>

            <form className="login-body" onSubmit={handleSubmit}>
              {error ? <div className="form-error">{error}</div> : null}

              <div className="field-group">
                <label className="field-label" htmlFor="login-email">
                  E-mail
                </label>
                <div className="field-wrap">
                  <input
                    id="login-email"
                    className={`field-input${focused === "email" ? " focused" : ""}`}
                    type="email"
                    placeholder="Ex: usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="login-password">
                  Senha
                </label>
                <div className="field-wrap">
                  <input
                    id="login-password"
                    className={`field-input${focused === "password" ? " focused" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    style={{ paddingRight: 56 }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    type="button"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="forgot-link">
                <a href="#">Esqueci minha senha</a>
              </div>

              <button className="btn-primary" type="submit">
                Entrar
              </button>

              <div className="divider">ou</div>

              <p className="register-prompt">
                Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
  );
}
