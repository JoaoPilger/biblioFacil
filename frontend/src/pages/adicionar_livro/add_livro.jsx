import { useState, useRef } from "react";
import "./add_livro.css";
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

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="cover-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="52" height="44" rx="6" fill="#4a3728" opacity="0.7"/>
      <circle cx="22" cy="26" r="6" fill="#f5ede6" opacity="0.6"/>
      <path d="M6 42 L20 30 L32 40 L44 28 L58 42" stroke="#f5ede6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  );
}

function ChevronDown({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

// Ícone de busca (lupa)
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function AdicionarLivro() {
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    ano_publ: "",
    edicao: "",
    editora: "",
    genero: "",
    isbn: "",
    paginas: "",
    sinopse: "",
  });
  const [genreOpen, setGenreOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para busca por ISBN
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState("");
  const [isbnSuccess, setIsbnSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Limpa feedback de ISBN ao alterar o campo manualmente
    if (e.target.name === "isbn") {
      setIsbnError("");
      setIsbnSuccess(false);
    }
  };

  const handleGenreSelect = (g) => {
    setForm((prev) => ({ ...prev, genero: g }));
    setGenreOpen(false);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Busca dados do livro na API OpenLibrary usando o ISBN informado.
   * Endpoint: https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data
   */
  const handleIsbnSearch = async () => {
    const isbn = form.isbn.replace(/[^0-9X]/gi, "").trim();
    if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
      setIsbnError("Digite um ISBN válido (10 ou 13 dígitos) antes de buscar.");
      return;
    }

    setIsbnLoading(true);
    setIsbnError("");
    setIsbnSuccess(false);

    try {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao conectar à OpenLibrary.");

      const data = await response.json();
      const key = `ISBN:${isbn}`;
      const book = data[key];

      if (!book) {
        setIsbnError("Livro não encontrado na OpenLibrary. Preencha os dados manualmente.");
        return;
      }

      // Extrai ano a partir de strings como "January 1, 1899" ou "1899"
      let ano = "";
      if (book.publish_date) {
        const match = String(book.publish_date).match(/\b(\d{4})\b/);
        if (match) ano = match[1];
      }

      // Extrai sinopse (tenta description.value, description como string, ou excerpt)
      let sinopse = "";
      if (book.description) {
        sinopse = typeof book.description === "string"
          ? book.description
          : book.description?.value || "";
      } else if (book.excerpts?.length > 0) {
        sinopse = book.excerpts[0].text || "";
      }

      setForm((prev) => ({
        ...prev,
        titulo:   book.title                        || prev.titulo,
        autor:    book.authors?.[0]?.name           || prev.autor,
        editora:  book.publishers?.[0]?.name        || prev.editora,
        ano_publ: ano                               || prev.ano_publ,
        paginas:  String(book.number_of_pages || "") || prev.paginas,
        sinopse:  sinopse                           || prev.sinopse,
      }));

      setIsbnSuccess(true);
    } catch (err) {
      setIsbnError("Falha ao buscar ISBN: " + (err.message || "Erro desconhecido."));
    } finally {
      setIsbnLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.titulo || !form.autor || !form.isbn) {
      alert("Por favor, preencha pelo menos título, autor e isbn!");
      return;
    }

    try {
      const formData = new FormData();

      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });
      
      if (coverFile) { 
        formData.append('capa', coverFile);
      }

      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiBase}/livros/cadastrar`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "Erro ao salvar livro");
      }

      const result = await response.json();
      console.log("Livro salvo:", result);
      alert("Livro salvo com sucesso! 📚");

      setForm({
        titulo: "",
        autor: "",
        ano_publ: "",
        edicao: "",
        editora: "",
        genero: "",
        paginas: "",
        sinopse: "",
        isbn: "",
      });

      setCoverPreview(null);
      setIsbnSuccess(false);
      setIsbnError("");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar livro: " + error.message);
    }
  };

  return (
    <div className="bibliofacil-app">

      <Header></Header>

      {/* PAGE */}
      <div className="page-wrapper">
        <h1 className="page-title">Adicionar Livro</h1>

        <div className="content-grid">
          {/* LEFT: Bibliographic Info */}
          <div className="card">
            <div className="step-header">
              <div className="step-badge">1</div>
              <span className="step-title">Informações Bibliográficas</span>
            </div>

            <form className="form-grid" onSubmit={handleSave}>

              {/* ISBN com busca automática — posicionado primeiro */}
              <div className="form-group">
                <label className="form-label">ISBN:</label>
                <div className="isbn-row">
                  <input
                    className={`form-input${isbnError ? " isbn-input--error" : ""}${isbnSuccess ? " isbn-input--success" : ""}`}
                    type="text"
                    name="isbn"
                    placeholder="Ex: 978-85-359-0277-5"
                    value={form.isbn}
                    onChange={handleChange}
                    maxLength={17}
                  />
                  <button
                    type="button"
                    className="isbn-search-btn"
                    onClick={handleIsbnSearch}
                    disabled={isbnLoading}
                    title="Buscar dados do livro pelo ISBN"
                  >
                    {isbnLoading ? (
                      <span className="isbn-spinner" />
                    ) : (
                      <SearchIcon />
                    )}
                    {isbnLoading ? "Buscando..." : "Buscar"}
                  </button>
                </div>
                {isbnError && (
                  <p className="isbn-feedback isbn-feedback--error">⚠ {isbnError}</p>
                )}
                {isbnSuccess && (
                  <p className="isbn-feedback isbn-feedback--success">✓ Dados preenchidos com sucesso! Revise e ajuste se necessário.</p>
                )}
              </div>

              {/* Título */}
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

              {/* Autor */}
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

              {/* Ano + Edição */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ano de Publicação:</label>
                  <input
                    className="form-input"
                    type="text"
                    name="ano_publ"
                    placeholder="Ex: 1998"
                    value={form.ano_publ}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Edição:</label>
                  <input
                    className="form-input"
                    type="text"
                    name="edicao"
                    placeholder="Ex: 5"
                    value={form.edicao}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Editora */}
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

              {/* Gênero + Páginas */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gênero/Classificação:</label>
                  <div className="genre-wrapper">
                    <button
                      type="button"
                      className={`genre-select-btn ${genreOpen ? "open" : ""}`}
                      onClick={() => setGenreOpen((v) => !v)}
                    >
                      <span style={{ fontStyle: form.genero ? "normal" : "italic", color: form.genero ? "var(--text-dark)" : "var(--text-muted)" }}>
                        {form.genero || "Clique para selecionar"}
                      </span>
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

              {/* Sinopse */}
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
            </form>
          </div>

          {/* RIGHT: Cover */}
          <div className="cover-card">
            <div className="step-header">
              <div className="step-badge">2</div>
              <span className="step-title">Capa do Livro</span>
            </div>

            <div
              className={`cover-upload-area ${coverPreview ? "has-image" : ""}`}
              onClick={!coverPreview ? handleUploadClick : undefined}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Capa do livro" />
              ) : (
                <>
                  <ImageIcon />
                  <button
                    type="button"
                    className="cover-upload-btn"
                    onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}
                  >
                    Fazer upload
                  </button>
                </>
              )}
            </div>

            {coverPreview && (
              <button
                type="button"
                className="cover-upload-btn"
                style={{ marginTop: 14 }}
                onClick={handleUploadClick}
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
        </div>

        {/* SAVE */}
        <div className="save-bar">
          <button className="btn-save" onClick={handleSave}>
            Salvar Livro
          </button>
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}
