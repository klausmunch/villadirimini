import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { HOTEL, MOTOR_RESERVAS } from "@/lib/hotel";
import logoHotel from "@/assets/logo-hotel.webp";

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/o-hotel", label: "O Hotel" },
  { to: "/acomodacoes", label: "Acomodações" },
  { to: "/lazer", label: "Lazer" },
  { to: "/cafe-da-manha", label: "Café da manhã" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="border-b border-paper/20 bg-surf">

      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link to="/" className="leading-none" onClick={() => setAberto(false)}>
          <img
            src={logoHotel}
            alt="Hotel Villa di Rimini"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-4 md:flex">
            {LINKS.slice(1).map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-paper/80 hover:text-paper"
                activeProps={{ className: "text-paper" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <a
            href={MOTOR_RESERVAS}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-paper px-4 py-2 text-xs font-semibold text-ink active:opacity-80"
          >
            Reservar
          </a>
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={aberto}
            onClick={() => setAberto((v) => !v)}
            className="flex size-9 flex-col items-center justify-center gap-1 rounded-full border border-paper/30 md:hidden"
          >
            <span className="block h-px w-4 bg-paper" />
            <span className="block h-px w-4 bg-paper" />
          </button>
        </div>
      </div>

      {aberto && (
        <nav className="border-t border-paper/20 bg-surf px-5 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setAberto(false)}
              className="block py-2 font-mono text-[12px] uppercase tracking-[0.15em] text-paper/80"
              activeProps={{ className: "text-paper" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
