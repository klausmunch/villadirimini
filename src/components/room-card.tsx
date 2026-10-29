import { useCallback, useEffect, useRef, useState } from "react";
import { FotoAmpliada } from "@/components/foto-ampliada";
import { MOTOR_RESERVAS } from "@/lib/hotel";

type Imagem = { src: string; alt: string };

export function RoomCard({
  nome,
  detalhe,
  descricao,
  imagens,
  etiqueta,
  delay = 0,
}: {
  nome: string;
  detalhe: string;
  descricao: string;
  imagens: Imagem[];
  etiqueta?: string | null;
  delay?: number;
}) {
  return (
    <div
      className="animate-rise overflow-hidden rounded-[14px] bg-paper-2 outline-1 -outline-offset-1 outline-black/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        {imagens.length ? (
          <FotosQuarto nome={nome} imagens={imagens} />
        ) : (
          <div className="h-44 w-full bg-black/5" aria-hidden="true" />
        )}
        {etiqueta && (
          <span className="pointer-events-none absolute left-3 top-3 -rotate-3 rounded-sm bg-surf px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper">
            {etiqueta}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-2xl leading-none tracking-tight text-ink">{nome}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2">
              {detalhe}
            </div>
          </div>
          <a
            href={MOTOR_RESERVAS}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-surf"
          >
            Reservar
          </a>
        </div>
        <p className="mt-3 text-sm leading-snug text-ink-2">{descricao}</p>
      </div>
    </div>
  );
}

/** Fotos do quarto lado a lado: deslizar no celular, setas no computador, indicadores embaixo. */
function FotosQuarto({ nome, imagens }: { nome: string; imagens: Imagem[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [ampliada, setAmpliada] = useState<number | null>(null);
  const varias = imagens.length > 1;

  // Retângulo da foto `i` no card: de onde a foto ampliada sai e para onde volta.
  const origemDe = useCallback((i: number) => {
    const foto = trilho.current?.children[i] as HTMLElement | undefined;
    return foto ? foto.getBoundingClientRect() : null;
  }, []);

  // Com a foto ampliada aberta, o card acompanha por trás (sem animação),
  // para a volta cair na foto certa.
  const acompanhar = useCallback((i: number) => {
    const el = trilho.current;
    if (el) el.scrollLeft = i * el.clientWidth;
    setAtual(i);
  }, []);

  const fechar = useCallback(() => setAmpliada(null), []);

  useEffect(() => {
    const el = trilho.current;
    if (!el || !varias) return;
    const aoRolar = () => setAtual(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", aoRolar, { passive: true });
    return () => el.removeEventListener("scroll", aoRolar);
  }, [varias]);

  function irPara(i: number) {
    const el = trilho.current;
    if (!el) return;
    const destino = (i + imagens.length) % imagens.length;
    el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div
      className="group/fotos relative"
      role={varias ? "region" : undefined}
      aria-roledescription={varias ? "carrossel" : undefined}
      aria-label={varias ? `Fotos do apartamento ${nome}` : undefined}
    >
      <div
        ref={trilho}
        className="flex h-44 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {imagens.map((img, i) => (
          <button
            key={img.src.slice(-40) + i}
            type="button"
            onClick={() => setAmpliada(i)}
            aria-label={`Ampliar foto ${i + 1} do apartamento ${nome}`}
            className="h-44 w-full shrink-0 snap-center cursor-zoom-in outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
          >
            <img
              src={img.src}
              alt={varias ? `${img.alt} (${i + 1} de ${imagens.length})` : img.alt}
              loading="lazy"
              draggable={false}
              // escondida enquanto está ampliada: é ela que "sai" do card
              className={`h-full w-full object-cover ${ampliada !== null && i === atual ? "invisible" : ""}`}
            />
          </button>
        ))}
      </div>

      {varias && (
        <>
          <button
            type="button"
            onClick={() => irPara(atual - 1)}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-paper/85 text-lg text-ink opacity-0 shadow-sm transition-opacity group-hover/fotos:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => irPara(atual + 1)}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-paper/85 text-lg text-ink opacity-0 shadow-sm transition-opacity group-hover/fotos:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
          >
            ›
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {imagens.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-1.5 transition-all ${i === atual ? "w-4 bg-paper" : "w-1.5 bg-paper/60"}`}
              />
            ))}
          </div>
          <span className="sr-only" aria-live="polite">
            Foto {atual + 1} de {imagens.length}
          </span>
        </>
      )}

      {ampliada !== null && (
        <FotoAmpliada
          nome={nome}
          imagens={imagens}
          inicio={ampliada}
          origemDe={origemDe}
          aoMudar={acompanhar}
          aoFechar={fechar}
        />
      )}
    </div>
  );
}
