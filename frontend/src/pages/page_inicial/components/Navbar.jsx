import { Link } from "react-router-dom";
import { BookIcon, UserIcon } from "./icons";

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <div className="navbar__logo-icon">
          <BookIcon size={22} color="#f5f0e8" />
        </div>
        <span className="navbar__title">BiblioFácil</span>
      </div>

      <div className="navbar__center">
        <a href="#" className="nav-link">
          Quem somos
        </a>
      </div>

      <div className="navbar__right">
        {user ? (
          <>
            <Link to="/adicionar-livro" className="nav-link nav-link--cta">
              Adicionar livro
            </Link>
            <div className="nav-avatar" aria-label="Usuário logado">
              <UserIcon />
            </div>
            <button type="button" className="nav-cta" onClick={onLogout}>
              Sair
            </button>
          </>
        ) : (
          <div className="nav-actions">
            <Link to="/login" className="nav-link">
              Entrar
            </Link>
            <Link to="/cadastro" className="nav-cta nav-cta--primary">
              Cadastrar
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
