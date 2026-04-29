import { SearchIcon } from "./icons";

export default function SearchBar({ value, onChange, onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-wrap">
      <span className="search-wrap__icon">
        <SearchIcon />
      </span>
      <input
        className="search-input"
        type="text"
        placeholder="Pesquise por livros, gêneros..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button className="search-button" onClick={onSearch} aria-label="Buscar">
        Buscar
      </button>
    </div>
  );
}
