import {SearchIcon} from "../../components/Icons";

export default function SearchBar({ value, onChange }) {
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
      />
    </div>
  );
}