import { useAuth } from "../../context/authContext";
import { Link } from "react-router-dom";
import { BookIcon, UserIcon } from "../Icons";

export default function Header() {
  const { user, logout, authenticated } = useAuth();
  const onLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo" aria-label="Ir para a página inicial">
        <div className="navbar__logo-icon">
          <BookIcon size={22} color="#f5f0e8" />
        </div>
        <span className="navbar__title">BiblioFácil</span>
      </Link>

      <div className="navbar__right">
        <a href="#" className="nav-link">
          Quem somos
        </a>
        {authenticated ? (
          <>
            <div className="nav-avatar" aria-label="Usuário logado">
              <UserIcon />
            </div>
            <button type="button" className="nav-cta" onClick={onLogout}>
              Sair
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-cta">
            <UserIcon />
            <span style={{ marginLeft: 8 }}>Entrar</span>
          </Link>
        )}
      </div>
    </nav>
  );
}