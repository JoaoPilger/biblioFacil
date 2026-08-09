import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./edit_livro.css";
import Header from "../../components/header/Header"
import Footer from "../../components/footer/Footer"
import API_BASE from "../../lib/apiBase";

const GENRES = [
  "Romance",
  "Ficção Científica",
  "Fantasia",
  "Terror",
  "Suspense",
  "Biografia",
  "História",
  "Autoajuda",
  "Poesia",
  "Infanto-juvenil",
  "Clássico",
  "Não-ficção",
];

const STATUS_OPTIONS = [
  {
    id: "disponivel",
    label: "Disponível",
    desc: "Pode ser emprestado",
    dotClass: "dot-green",
  },
  {
    id: "emprestado",
    label: "Emprestado",
    desc: "Já está em circulação",
    dotClass: "dot-orange",
  },
  {
    id: "reservado",
    label: "Reservado",
    desc: "Esperando ser retirado",
    dotClass: "dot-blue",
  },
];

function ChevronDown({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

function CoverIcon() {
  return (
    <svg
      className="cover-icon"
      width="54"
      height="54"
      viewBox="0 0 64 64"
      fill="none"
    >
      <rect x="6" y="10" width="52" height="44" rx="6" fill="#4a3728" opacity="0.7" />
      <circle cx="22" cy="26" r="6" fill="#f5ede6" opacity="0.6" />
      <path
        d="M6 42 L20 30 L32 40 L44 28 L58 42"
        stroke="#f5ede6"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

function buildCoverPreviewUrl(baseUrl, coverPath) {
  if (!coverPath) return null;
  if (/^https?:\/\//i.test(coverPath)) return coverPath;

  const normalizedPath = coverPath.replace(/^\/public\//, "/");
  return `${baseUrl}${normalizedPath}`;
}

function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-backdrop">
      <div className="confirm-dialog">
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--cancel" onClick={onCancel}>
            Não
          </button>
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--confirm" onClick={onConfirm}>
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditarLivro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    ano_publ: "",
    edicao: "",
    editora: "",
    genero: "",
    paginas: "",
    sinopse: "",
    quantidade_exemplares: "1",
    id: ""
  });
  const [genreOpen, setGenreOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [status, setStatus] = useState("reservado");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`${API_BASE}/livros/${id}`);
        
        if (!response.ok) throw new Error("Livro não encontrado");
        const data = await response.json();
        const book = data;
        setForm({
          titulo: book.titulo || "",
          autor: book.autor || "",
          ano_publ: book.ano_publ || "",
          edicao: book.edicao || "",
          editora: book.editora || "",
          genero: book.genero || "",
          paginas: book.paginas || "",
          sinopse: book.sinopse || "",
          quantidade_exemplares: String(book.quantidade_exemplares || 1),
        });
        const existingCoverUrl = buildCoverPreviewUrl(
          API_BASE,
          book.capa_url || book.capa
        );
        if (existingCoverUrl) setCoverPreview(existingCoverUrl);
        if (book.status) setStatus(book.status);
      } catch (error) {
        console.error("Erro ao carregar livro:", error);
        toast.error("Erro ao carregar livro: " + error.message);
      }
    };
    fetchBook();
  }, [id]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGenreSelect = (g) => {
    setForm((prev) => ({ ...prev, genero: g }));
    setGenreOpen(false);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.titulo || !form.autor) {
      toast.error("Preencha pelo menos título e autor.");
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });
      formData.append("status", status);
      if (coverFile) {
        formData.append("capa", coverFile);
      }

      const response = await fetch(`${API_BASE}/livros/editar/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "Erro ao salvar livro");
      }
      toast.success("Livro atualizado com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar livro: " + error.message);
    }
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    try {
      const response = await fetch(`${API_BASE}/livros/deletar/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Erro ao deletar livro");
      toast.success("Livro excluído com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao deletar livro: " + error.message);
    }
  };

  return (
    <div className="bibliofacil-app">

      <Header/>

      <div className="page-wrapper">
        <h1 className="page-title">Editar Livro</h1>

        <div className="content-grid">
          <div className="card">
            <div className="step-header">
              <div className="step-badge">1</div>
              <span className="step-title">Informações Bibliográficas</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-titulo">Título:</label>
                <input
                  id="edit-titulo"
                  className="form-input"
                  type="text"
                  name="titulo"
                  placeholder="Ex: Dom Casmurro"
                  value={form.titulo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-autor">Autor:</label>
                <input
                  id="edit-autor"
                  className="form-input"
                  type="text"
                  name="autor"
                  placeholder="Ex: Machado de Assis"
                  value={form.autor}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-ano">Ano de Publicação:</label>
                  <input
                    id="edit-ano"
                    className="form-input"
                    type="number"
                    name="ano_publ"
                    placeholder="Ex: 1998"
                    value={form.ano_publ}
                    onChange={handleChange}
                    min="0"
                    max="2100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-edicao">Edição:</label>
                  <input
                    id="edit-edicao"
                    className="form-input"
                    type="number"
                    name="edicao"
                    placeholder="Ex: 3"
                    value={form.edicao}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              {/* Editora + Quantidade de Exemplares */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-editora">Editora:</label>
                  <input
                    id="edit-editora"
                    className="form-input"
                    type="text"
                    name="editora"
                    placeholder="Ex: Companhia das Letras"
                    value={form.editora}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-exemplares">Quantidade de Exemplares:</label>
                  <input
                    id="edit-exemplares"
                    className="form-input"
                    type="number"
                    name="quantidade_exemplares"
                    placeholder="Ex: 1"
                    value={form.quantidade_exemplares}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gênero/Classificação:</label>
                  <div className="genre-wrapper">
                    <button
                      type="button"
                      className={`genre-btn ${genreOpen ? "open" : ""} ${form.genero ? "has-value" : ""}`}
                      onClick={() => setGenreOpen((v) => !v)}
                    >
                      <span>{form.genero || "Clique para selecionar"}</span>
                      <ChevronDown className="chevron" />
                    </button>
                    {genreOpen && (
                      <div className="dropdown-menu">
                        {GENRES.map((g) => (
                          <div
                            key={g}
                            className="dropdown-item"
                            onClick={() => handleGenreSelect(g)}
                          >
                            {g}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-paginas">Número de Páginas:</label>
                  <input
                    id="edit-paginas"
                    className="form-input"
                    type="number"
                    name="paginas"
                    placeholder="Ex: 200"
                    value={form.paginas}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-sinopse">Sinopse:</label>
                <textarea
                  id="edit-sinopse"
                  className="form-textarea"
                  name="sinopse"
                  placeholder="Descrição do Conteúdo do Livro..."
                  value={form.sinopse}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="right-col">
            <div className="card">
              <div className="step-header">
                <div className="step-badge">2</div>
                <span className="step-title">Capa do Livro</span>
              </div>

              <div
                className={`cover-upload-area ${coverPreview ? "has-image" : ""}`}
                onClick={() => !coverPreview && fileInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Capa do livro" />
                ) : (
                  <>
                    <CoverIcon />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Fazer upload
                    </button>
                  </>
                )}
              </div>

              {coverPreview && (
                <button
                  type="button"
                  className="upload-btn"
                  style={{ marginTop: 12, display: "block", margin: "12px auto 0" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Trocar imagem
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={handleCoverChange}
              />
            </div>

            <div className="card">
              <div className="step-header">
                <div className="step-badge">3</div>
                <span className="step-title">Status Inicial</span>
              </div>

              <div className="status-list">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`status-option ${status === opt.id ? "active" : ""}`}
                    onClick={() => setStatus(opt.id)}
                  >
                    <span className={`status-dot ${opt.dotClass}`} />
                    <div className="status-texts">
                      <span className="status-name">{opt.label}</span>
                      <span className="status-desc">{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="action-bar">
          <button className="btn-delete" onClick={() => setConfirmOpen(true)}>
            Excluir Livro
          </button>
          <button className="btn-save" onClick={handleSave}>
            Salvar Livro
          </button>
        </div>
      </div>
      <Footer></Footer>

      <ConfirmDialog
        open={confirmOpen}
        message="Tem certeza que deseja excluir este livro?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}