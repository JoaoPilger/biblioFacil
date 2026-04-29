import { useMemo } from "react";
import { BookIcon } from "./icons";

export default function Footer() {
  const columns = useMemo(
    () => [
      { heading: "BiblioFácil", links: ["Início", "Explorar", "Suporte"] },
      { heading: "Social", links: ["LinkedIn", "Instagram", "Contato"] },
    ],
    []
  );

  return (
    <footer className="footer">
      <div>
        <div className="footer__brand">
          <div className="footer__logo-icon">
            <BookIcon size={22} color="#f5f0e8" />
          </div>
          <div className="footer__brand-name">
            BiblioFácil
            <br />
            <span className="footer__brand-sub">Biblioteca</span>
          </div>
        </div>
        <p className="footer__copy">© 2026 BiblioFácil. Todos os direitos reservados</p>
      </div>

      <div className="footer__links">
        {columns.map((col) => (
          <div key={col.heading} className="footer__col">
            <h4>{col.heading}</h4>
            {col.links.map((link) => (
              <a key={link} href="#" className="footer-link">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
