import { Link } from "@tanstack/react-router";
import { HOTEL } from "@/lib/hotel";

export function SiteFooter() {
  return (
    <footer className="bg-ink px-5 pb-40 pt-6 text-paper md:pb-6">
      <div className="mx-auto max-w-5xl">
        <div className="font-display text-3xl leading-none tracking-tight">VILLA DI RIMINI</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60">
          {HOTEL.bairro} · {HOTEL.cidade} · {HOTEL.uf}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-paper/80">
          <a href={HOTEL.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <span className="text-surf">/</span>
          <a href={HOTEL.facebook} target="_blank" rel="noreferrer">
            Facebook
          </a>
          <span className="text-surf">/</span>
          <Link to="/contato">Reservas</Link>
          <span className="text-surf">/</span>
          <Link to="/politica-de-privacidade">Política de privacidade</Link>
          <span className="text-surf">/</span>
          <Link to="/admin" className="text-paper/50">
            Admin
          </Link>

        </div>
        <p className="mt-4 font-mono text-[10px] text-paper/50">
          © 2026 {HOTEL.nome} · {HOTEL.endereco}, {HOTEL.bairro} —{" "}
          {HOTEL.cidade}/{HOTEL.uf}
        </p>
      </div>
    </footer>
  );
}
