import { useState, useRef } from "react";
import "./add_livro.css";

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

export default function AdicionarLivro() {
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
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenreSelect = (g) => {
    setForm((prev) => ({ ...prev, genero: g }));
    setGenreOpen(false);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!form.titulo || !form.autor) {
      alert("Por favor, preencha pelo menos título e autor!");
      return;
    }

    try {
      const bookData = {
        ...form,
        capa: coverPreview
      };

      const response = await fetch("http://localhost:3000/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookData)
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar livro");
      }

      const result = await response.json();
      console.log("Livro salvo:", result);
      alert("Livro salvo com sucesso! 📚");
      
      // Limpar formulário
      setForm({
        titulo: "",
        autor: "",
        ano: "",
        edicao: "",
        editora: "",
        genero: "",
        paginas: "",
        sinopse: ""
      });
      setCoverPreview(null);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar livro: " + error.message);
    }
  };

  return (
    <div className="bibliofacil-app">
      {/* NAVBAR */}
      <nav className="navbar">
        <span className="navbar-logo">BiblioFácil</span>
        <div className="navbar-right">
          <a href="#" className="navbar-link">Quem somos</a>
          <div className="navbar-icon">
            <UserIcon />
          </div>
        </div>
      </nav>

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
    </div>
  );
}