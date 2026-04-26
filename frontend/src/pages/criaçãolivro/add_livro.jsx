import { useState, useRef } from "react";
import "./AddBook.css";

const generos = [
  "Romance",
  "Ficção Científica",
  "Fantasy",
  "Terror",
  "Mistério",
  "Biografia",
  "História",
  "Autoajuda",
  "Filosofia",
  "Infantil",
  "Outros",
];

export default function AddBook() {
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
  const [coverPreview, setCoverPreview] = useState(null);
  const [toast, setToast] = useState(false);
  const fileRef = useRef();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const handleUploadClick = () => {
    fileRef.current.click();
  };

  const handleSave = (e) => {
    e.preventDefault();
    setToast(true);
    setTimeout(() => setToast(false), 2800);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <span className="navbar__logo">BiblioFácil</span>
        <div className="navbar__links">
          <a href="#" className="navbar__link">Quem somos</a>
          <div className="navbar__avatar" title="Perfil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        </div>
      </nav>

      {/* PAGE */}
      <main className="page">
        <h1 className="page__title">Adicionar Livro</h1>

        <form className="form-layout" onSubmit={handleSave}>

          {/* CARD 1 — Informações */}
          <div className="card card--main">
            <div className="card__header">
              <span className="card__step">1</span>
              <span className="card__title">Informações Bibliográficas</span>
            </div>

            <div className="form__group">
              <label className="form__label">Título:</label>
              <input
                className="form__input"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                placeholder="Ex: Dom Casmurro"
              />
            </div>

            <div className="form__group">
              <label className="form__label">Autor:</label>
              <input
                className="form__input"
                name="autor"
                value={form.autor}
                onChange={handleChange}
                placeholder="Ex: Machado de Assis"
              />
            </div>

            <div className="form__group--row">
              <div className="form__group">
                <label className="form__label">Ano de Publicação:</label>
                <input
                  className="form__input"
                  name="ano"
                  value={form.ano}
                  onChange={handleChange}
                  placeholder="Ex: 1998"
                  type="number"
                  min="1000"
                  max="2099"
                />
              </div>
              <div className="form__group">
                <label className="form__label">Edição:</label>
                <input
                  className="form__input"
                  name="edicao"
                  value={form.edicao}
                  onChange={handleChange}
                  placeholder="Ex: 5"
                  type="number"
                  min="1"
                />
              </div>
            </div>

            <div className="form__group">
              <label className="form__label">Editora:</label>
              <input
                className="form__input"
                name="editora"
                value={form.editora}
                onChange={handleChange}
                placeholder="Ex: Companhia das Letras"
              />
            </div>

            <div className="form__group--row">
              <div className="form__group">
                <label className="form__label">Gênero/Classificação:</label>
                <select
                  className="form__select"
                  name="genero"
                  value={form.genero}
                  onChange={handleChange}
                >
                  <option value="" disabled>Clique para selecionar</option>
                  {generos.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form__group">
                <label className="form__label">Número de Páginas:</label>
                <input
                  className="form__input"
                  name="paginas"
                  value={form.paginas}
                  onChange={handleChange}
                  placeholder="Ex: 200"
                  type="number"
                  min="1"
                />
              </div>
            </div>

            <div className="form__group">
              <label className="form__label">Sinopse:</label>
              <textarea
                className="form__textarea"
                name="sinopse"
                value={form.sinopse}
                onChange={handleChange}
                placeholder="Descrição do Conteúdo do Livro..."
              />
            </div>
          </div>

          {/* CARD 2 — Capa */}
          <div className="card card--cover">
            <div className="card__header">
              <span className="card__step">2</span>
              <span className="card__title">Capa do Livro</span>
            </div>

            <div className="upload-area" onClick={handleUploadClick}>
              {coverPreview ? (
                <img src={coverPreview} alt="Capa" className="upload-area__preview" />
              ) : (
                <svg className="upload-area__icon" width="52" height="52" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>

            <input
              type="file"
              ref={fileRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleCoverChange}
            />

            <button type="button" className="upload-btn" onClick={handleUploadClick}>
              Fazer upload
            </button>
          </div>

        </form>

        {/* SAVE */}
        <button className="save-btn" onClick={handleSave}>
          Salvar Livro
        </button>
      </main>

      {/* TOAST */}
      <div className={`toast ${toast ? "toast--visible" : ""}`}>
        ✓ Livro salvo com sucesso!
      </div>
    </>
  );
}