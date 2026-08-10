import "./livro.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/header/Header"
import Footer from "../../components/footer/Footer"
import SearchBar from "../../components/searchBar/SearchBar";
import ReservaModal from "../../components/reserva/ReservaModal";
import useBookSearchNavigation from "../../hooks/useBookSearchNavigation";
import { useAuth } from "../../context/authContext";
import {
  getMinhaReserva,
  cancelarReserva,
  getMeuEmprestimo,
} from "../../services/reservas";

const API_BASE = "http://localhost:3000/";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function BookHero({
  title,
  author,
  capa_url,
  status = "Disponível",
  onReserve,
  reserveDisabled,
  onEdit,
  canEdit,
  reservaPendente,
  onCancelReserva,
  cancelBusy,
  meuEmprestimo,
  canReserve,
}) {
  const capa_url_completa = capa_url
  ? `${API_BASE}${capa_url.replace("/public", "")}`
  : `${API_BASE}/covers/default.svg`;

  return (
    <div className="book-hero">
      <div className="book-hero__cover">
        <img className="book-hero__cover" src={capa_url_completa} alt="" />
      </div>
      <div className="book-hero__info">
        <h1 className="book-hero__title">{title} - {author}</h1>
        <div className="book-hero__status">
          <span className="status-dot" />
          {meuEmprestimo
            ? `Reservado com você. Devolução prevista: ${formatDate(meuEmprestimo.data_devolucao_prevista)}`
            : `Status: ${status}`}
        </div>
        <div className="book-hero__actions">
          {!canReserve ? null : reservaPendente ? (
            <>
              <button className="btn-schedule btn-schedule--pending" type="button" disabled>
                Reserva pendente
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={onCancelReserva}
                disabled={cancelBusy}
              >
                {cancelBusy ? "Cancelando..." : "Cancelar"}
              </button>
            </>
          ) : meuEmprestimo ? (
            <button className="btn-schedule btn-schedule--pending" type="button" disabled>
              Emprestado com você
            </button>
          ) : (
            <button className="btn-schedule" type="button" onClick={onReserve} disabled={reserveDisabled}>
              Reservar/Retirar
            </button>
          )}
          {canEdit && (
            <button className="btn-edit" type="button" onClick={onEdit}>
              Editar Livro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Sinopse({ text }) {
  return (
    <div className="sinopse">
      <h2 className="sinopse__heading">Sinopse</h2>
      <p className="sinopse__text">{text}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function BiblioFacilDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useBookSearchNavigation();
  const { authenticated, loading: authLoading, user } = useAuth();
  const [query, setQuery] = useState("");
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [minhaReserva, setMinhaReserva] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [meuEmprestimo, setMeuEmprestimo] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        // Faz a chamada para a rota definida no controller
        const response = await fetch(`http://localhost:3000/livros/${id}`);
        
        if (!response.ok) {
          throw new Error("Livro não encontrado");
        }

        const data = await response.json();
        console.log(data);
        
        setBook(data);
      } catch (error) {
        console.error("Erro ao carregar livro:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBook();
  }, [id]);

  const isBibliotecario = user?.tipo === "bibliotecario";

  useEffect(() => {
    if (!id || authLoading || !authenticated || isBibliotecario) {
      setMinhaReserva(null);
      return;
    }
    let cancelled = false;
    getMinhaReserva(id).then((reserva) => {
      if (!cancelled) setMinhaReserva(reserva);
    });
    return () => {
      cancelled = true;
    };
  }, [id, authenticated, authLoading, isBibliotecario]);

  useEffect(() => {
    if (!id || authLoading || !authenticated || isBibliotecario) {
      setMeuEmprestimo(null);
      return;
    }
    let cancelled = false;
    getMeuEmprestimo(id).then((emprestimo) => {
      if (!cancelled) setMeuEmprestimo(emprestimo);
    });
    return () => {
      cancelled = true;
    };
  }, [id, authenticated, authLoading, isBibliotecario]);

  const handleCancelReserva = async () => {
    if (!minhaReserva) return;
    setCancelBusy(true);
    try {
      await cancelarReserva(id);
      setMinhaReserva(null);
      setBook((b) => (b ? { ...b, status: "disponivel" } : b));
    } catch (error) {
      alert(error?.message || "Erro ao cancelar reserva.");
    } finally {
      setCancelBusy(false);
    }
  };

  // Lógica de desabilitar botão baseada no status vindo do banco (init.sql)
  const s = String(book?.status || "").toLowerCase();
  const reserveDisabled = authLoading || !authenticated || s !== "disponivel";
  const canEdit = authenticated && isBibliotecario;
  const canReserve = !isBibliotecario;

  if (loading) return <div>Carregando...</div>;
  if (!book) return <div>Livro não encontrado.</div>;

  return (
    <div className="app">
      <Header />
      <SearchBar value={query} onChange={setQuery} onSearch={() => search(query)} />

      <main className="main">
        <BookHero
          title={book.titulo} // Usando 'titulo' conforme definido no init.sql
          author={book.autor}
          capa_url={book.capa_url} // Usando 'autor' conforme definido no init.sql
          status={book.status}
          onReserve={() => setReservaOpen(true)}
          reserveDisabled={reserveDisabled}
          onEdit={() => navigate(`/editar/${id}`)}
          canEdit={canEdit}
          reservaPendente={!!minhaReserva}
          onCancelReserva={handleCancelReserva}
          cancelBusy={cancelBusy}
          meuEmprestimo={meuEmprestimo}
          canReserve={canReserve}
        />
        <Sinopse text={book.sinopse} />
        <div className="book-details-extra" style={{ padding: '0 20px', fontSize: '0.9rem' }}>
          <p><strong>Editora:</strong> {book.editora}</p>
          <p><strong>Ano:</strong> {book.ano_publ}</p>
          <p><strong>Gênero:</strong> {book.genero}</p>
        </div>
      </main>

      <Footer />

      <ReservaModal
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
        onSuccess={(data) => {
          // atualização otimista: se reservou, status já muda sem recarregar
          setBook((b) => (b ? { ...b, status: "reservado" } : b));
          setMinhaReserva(data?.reserva ?? null);
        }}
        book={book}
      />
    </div>
  );
}