import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Header from "./header/Header";
import "./BibliotecarioRoute.css";

export default function BibliotecarioRoute({ children }) {
  const { authenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="bibliotecario-gate">
        <Header />
        <main className="bibliotecario-gate__main">Carregando…</main>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.tipo !== "bibliotecario") {
    return (
      <div className="bibliotecario-gate">
        <Header />
        <main className="bibliotecario-gate__main">
          <h1 className="bibliotecario-gate__title">Acesso restrito</h1>
          <p className="bibliotecario-gate__text">
            Esta área é exclusiva para <strong>bibliotecários</strong>. Sua conta é de leitor;
            se precisar cadastrar ou editar o acervo, peça acesso à administração da biblioteca.
          </p>
          <Link className="bibliotecario-gate__link" to="/">
            Voltar à página inicial
          </Link>
        </main>
      </div>
    );
  }

  return children;
}
