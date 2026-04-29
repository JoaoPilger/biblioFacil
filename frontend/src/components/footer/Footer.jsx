import { BookIcon, UserIcon } from "../Icons";
import { useMemo} from "react";

export default function Footer() {
  const columns = useMemo(
    () => [
      { heading: "Athom System", links: ["Produtos", "Quem Somos", "Log In"] },
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
            ATHOM
            <br />
            <span className="footer__brand-sub">SYSTEM</span>
          </div>
        </div>
        <p className="footer__copy">© 2024 Athom System. Todos os direitos reservados</p>
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