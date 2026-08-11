import "./livro.css";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/header/Header"
import Footer from "../../components/footer/Footer"
import SearchBar from "../../components/searchBar/SearchBar";
import ReservaModal from "../../components/reserva/ReservaModal";
import AvaliacaoSection from "../../components/avaliacao/AvaliacaoSection";
import FavoritoButton from "../../components/favorito/FavoritoButton";
import { StarDisplay } from "../../components/avaliacao/StarRating";
import useBookSearchNavigation from "../../hooks/useBookSearchNavigation";
import { useAuth } from "../../context/authContext";
import API_BASE from "../../lib/apiBase";
import {
  getMinhaReserva,
  cancelarReserva,
  getMeuEmprestimo,
} from "../../services/reservas";
import { getAvaliacoes, getMinhaAvaliacao } from "../../services/avaliacoes";
import { verificarFavorito, adicionarFavorito, removerFavorito } from "../../services/favoritos";

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
  exemplaresDisponiveis = 1,
  quantidadeExemplares = 1,
  mediaAvaliacao = 0,
  totalAvaliacoes = 0,
  favoritado,
  onToggleFavorito,
  favoritoBusy,
  showFavorito,
}) {
  const capa_url_completa = capa_url
  ? `${API_BASE}/${capa_url.replace("/public", "")}`
  : `${API_BASE}/covers/default.svg`;

  const temDisponivel = exemplaresDisponiveis > 0;

  return (
    <div className="book-hero">
      <div className="book-hero__cover">
        <img className="book-hero__cover" src={capa_url_completa} alt="" />
      </div>
      <div className="book-hero__info">
        <h1 className="book-hero__title">{title} - {author}</h1>

        {totalAvaliacoes > 0 && (
          <div className="book-hero__rating">
            <StarDisplay rating={mediaAvaliacao} size={18} />
            <span>{Number(mediaAvaliacao).toFixed(1)} ({totalAvaliacoes})</span>
          </div>
        )}

        <div className="book-hero__status">
          <span className="status-dot" style={{ backgroundColor: temDisponivel ? '#7aaa72' : '#d9534f' }} />
          {meuEmprestimo
            ? `Reservado com você. Devolução prevista: ${formatDate(meuEmprestimo.data_devolucao_prevista)}`
            : `Status: ${temDisponivel ? 'Disponível' : 'Indisponível'}`}
        </div>

        <div className={`exemplares-badge ${temDisponivel ? '' : 'exemplares-badge--esgotado'}`}>
          📚 Exemplares disponíveis: <strong>{exemplaresDisponiveis} de {quantidadeExemplares}</strong>
        </div>

        <div className="book-hero__actions">
          {showFavorito && (
            <FavoritoButton
              favoritado={favoritado}
              onToggle={onToggleFavorito}
              busy={favoritoBusy}
            />
          )}
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
              {temDisponivel ? "Reservar/Retirar" : "Esgotado"}
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

export default function BiblioFacilDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = useBookSearchNavigation();
  const { authenticated, loading: authLoading, user } = useAuth();
  const [query, setQuery] = useState("");
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [minhaReserva, setMinhaReserva] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [meuEmprestimo, setMeuEmprestimo] = useState(null);
  const [avaliacoesData, setAvaliacoesData] = useState({ avaliacoes: [], media: 0, total: 0 });
  const [minhaAvaliacaoData, setMinhaAvaliacaoData] = useState({ avaliacao: null, pode_avaliar: false });
  const [favoritado, setFavoritado] = useState(false);
  const [favoritoBusy, setFavoritoBusy] = useState(false);

  const isBibliotecario = user?.tipo === "bibliotecario";

  const loadAvaliacoes = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getAvaliacoes(id);
      setAvaliacoesData(data);
    } catch {
      setAvaliacoesData({ avaliacoes: [], media: 0, total: 0 });
    }
  }, [id]);

  const loadMinhaAvaliacao = useCallback(async () => {
    if (!id || !authenticated || isBibliotecario) {
      setMinhaAvaliacaoData({ avaliacao: null, pode_avaliar: false });
      return;
    }
    const data = await getMinhaAvaliacao(id);
    setMinhaAvaliacaoData(data);
  }, [id, authenticated, isBibliotecario]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/livros/${id}`);
        
        if (!response.ok) {
          throw new Error("Livro não encontrado");
        }

        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error("Erro ao carregar livro:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBook();
  }, [id]);

  useEffect(() => {
    loadAvaliacoes();
  }, [loadAvaliacoes]);

  useEffect(() => {
    loadMinhaAvaliacao();
  }, [loadMinhaAvaliacao]);

  useEffect(() => {
    if (!id || authLoading || !authenticated || isBibliotecario) {
      setFavoritado(false);
      return;
    }
    verificarFavorito(id).then(setFavoritado);
  }, [id, authenticated, authLoading, isBibliotecario]);

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

  useEffect(() => {
    if (location.hash === "#avaliar" && !loading && !authLoading) {
      requestAnimationFrame(() => {
        document.getElementById("avaliar")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash, loading, authLoading]);

  const handleCancelReserva = async () => {
    if (!minhaReserva) return;
    setCancelBusy(true);
    try {
      await cancelarReserva(id);
      setMinhaReserva(null);
      setBook((b) => (b ? {
        ...b,
        status: "disponivel",
        exemplares_disponiveis: (b.exemplares_disponiveis || 0) + 1
      } : b));
    } catch (error) {
      toast.error(error?.message || "Erro ao cancelar reserva.");
    } finally {
      setCancelBusy(false);
    }
  };

  const handleToggleFavorito = async () => {
    if (!authenticated) {
      toast.error("Faça login para favoritar livros.");
      navigate("/login");
      return;
    }
    setFavoritoBusy(true);
    try {
      if (favoritado) {
        await removerFavorito(id);
        setFavoritado(false);
        toast.success("Removido dos favoritos.");
      } else {
        await adicionarFavorito(id);
        setFavoritado(true);
        toast.success("Adicionado aos favoritos!");
      }
    } catch (error) {
      toast.error(error?.message || "Erro ao atualizar favorito.");
    } finally {
      setFavoritoBusy(false);
    }
  };

  const handleAvaliacaoSaved = async () => {
    await loadAvaliacoes();
    await loadMinhaAvaliacao();
    const response = await fetch(`${API_BASE}/livros/${id}`);
    if (response.ok) {
      const data = await response.json();
      setBook(data);
    }
  };

  const qtdTotal = Math.max(1, Number(book?.quantidade_exemplares) || 1);
  const dispCount = book?.exemplares_disponiveis !== undefined
    ? Number(book.exemplares_disponiveis)
    : (book?.status === "disponivel" ? 1 : 0);

  const reserveDisabled = authLoading || !authenticated || dispCount <= 0;
  const canEdit = authenticated && isBibliotecario;
  const canReserve = !isBibliotecario;
  const showFavorito = authenticated && !isBibliotecario;

  if (loading) return <div>Carregando...</div>;
  if (!book) return <div>Livro não encontrado.</div>;

  const mediaAvaliacao = book.media_avaliacao ?? avaliacoesData.media;
  const totalAvaliacoes = book.total_avaliacoes ?? avaliacoesData.total;

  return (
    <div className="app">
      <Header />
      <SearchBar value={query} onChange={setQuery} onSearch={() => search(query)} />

      <main className="main">
        <BookHero
          title={book.titulo}
          author={book.autor}
          capa_url={book.capa_url}
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
          exemplaresDisponiveis={dispCount}
          quantidadeExemplares={qtdTotal}
          mediaAvaliacao={mediaAvaliacao}
          totalAvaliacoes={totalAvaliacoes}
          favoritado={favoritado}
          onToggleFavorito={handleToggleFavorito}
          favoritoBusy={favoritoBusy}
          showFavorito={showFavorito}
        />
        <Sinopse text={book.sinopse} />
        <div className="book-details-extra" style={{ padding: '0 20px', fontSize: '0.9rem' }}>
          <p><strong>Editora:</strong> {book.editora || "—"}</p>
          <p><strong>Ano:</strong> {book.ano_publ || "—"}</p>
          <p><strong>Gênero:</strong> {book.genero || "—"}</p>
          <p><strong>Total de Exemplares:</strong> {qtdTotal}</p>
        </div>

        <div id="avaliar">
          <AvaliacaoSection
            bookId={id}
            authenticated={authenticated}
            isBibliotecario={isBibliotecario}
            minhaAvaliacao={minhaAvaliacaoData.avaliacao}
            podeAvaliar={minhaAvaliacaoData.pode_avaliar}
            avaliacoes={avaliacoesData.avaliacoes}
            media={mediaAvaliacao}
            total={totalAvaliacoes}
            onSaved={handleAvaliacaoSaved}
            autoEdit={location.hash === "#avaliar"}
          />
        </div>
      </main>

      <Footer />

      <ReservaModal
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
        onSuccess={(data) => {
          setBook((b) => (b ? { ...b, status: "reservado" } : b));
          setMinhaReserva(data?.reserva ?? null);
        }}
        book={book}
      />
    </div>
  );
}
