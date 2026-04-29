import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./edit_livro.css";
import Header from "../../components/header/Header"
import Footer from "../../components/footer/Footer"

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

export default function EditarLivro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    ano: "",
    edicao: "",
    editora: "",
    genero: "",
    paginas: "",
    sinopse: "",
  });
  const [genreOpen, setGenreOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [status, setStatus] = useState("reservado");
  const fileInputRef = useRef(null);

  // Carregar dados do livro ao montar o componente
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/books/${id}`);
        if (!response.ok) throw new Error("Livro não encontrado");
        const data = await response.json();
        const book = data.item;
        setForm({
          titulo: book.titulo || "",
          autor: book.autor || "",
          ano: book.ano || "",
          edicao: book.edicao || "",
          editora: book.editora || "",
          genero: book.genero || "",
          paginas: book.paginas || "",
          sinopse: book.sinopse || "",
        });
        if (book.capa) setCoverPreview(book.capa);
        if (book.status) setStatus(book.status);
      } catch (error) {
        console.error("Erro ao carregar livro:", error);
        alert("Erro ao carregar livro: " + error.message);
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
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      const bookData = {
        ...form,
        capa: coverPreview,
        status: status
      };

      const response = await fetch(`http://localhost:3000/api/books/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookData)
      });

      if (!response.ok) throw new Error("Erro ao salvar livro");
      alert("Livro atualizado com sucesso! ✅");
      navigate("/");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar livro: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este livro?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/books/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Erro ao deletar livro");
      alert("Livro excluído com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao deletar livro: " + error.message);
    }
  };

  return (
    <div className="bibliofacil-app">

      <Header/>

      {/* PAGE */}
      <div className="page-wrapper">
        <h1 className="page-title">Editar Livro</h1>

        <div className="content-grid">
          {/* LEFT: Bibliographic Info */}
          <div className="card">
            <div className="step-header">
              <div className="step-badge">1</div>
              <span className="step-title">Informações Bibliográficas</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Título:</label>
                <input
                  className="form-input"
                  type="text"
                  name="titulo"
                  placeholder="Ex: Dom Casmurro"
                  value={form.titulo}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Autor:</label>
                <input
                  className="form-input"
                  type="text"
                  name="autor"
                  placeholder="Ex: Machado de Assis"
                  value={form.autor}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ano de Publicação:</label>
                  <input
                    className="form-input"
                    type="text"
                    name="ano"
                    placeholder="Ex: 1998"
                    value={form.ano}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Edição:</label>
                  <input
                    className="form-input"
                    type="text"
                    name="edicao"
                    placeholder="Ex: 3"
                    value={form.edicao}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Editora:</label>
                <input
                  className="form-input"
                  type="text"
                  name="editora"
                  placeholder="Ex: Companhia das Letras"
                  value={form.editora}
                  onChange={handleChange}
                />
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
                  <label className="form-label">Número de Páginas:</label>
                  <input
                    className="form-input"
                    type="text"
                    name="paginas"
                    placeholder="Ex: 200"
                    value={form.paginas}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sinopse:</label>
                <textarea
                  className="form-textarea"
                  name="sinopse"
                  placeholder="Descrição do Conteúdo do Livro..."
                  value={form.sinopse}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* Card 2: Cover */}
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

            {/* Card 3: Status */}
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

        {/* ACTION BAR */}
        <div className="action-bar">
          <button className="btn-delete" onClick={handleDelete}>
            Excluir Livro
          </button>
          <button className="btn-save" onClick={handleSave}>
            Salvar Livro
          </button>
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}