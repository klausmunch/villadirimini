import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { iconeDaCaracteristica } from "@/components/caracteristicas";

type Imagem = { src: string; alt: string };

const DURACAO = 460;
const CURVA = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Transformação que faz a foto (já no tamanho final) parecer estar no lugar `origem`:
 * escala uniforme para cobrir o retângulo + recorte, igual ao object-cover do card.
 */
function quadroDeOrigem(final: DOMRect, origem: DOMRect) {
  const escala = Math.max(origem.width / final.width, origem.height / final.height);
  const dx = origem.left + origem.width / 2 - (final.left + final.width / 2);
  const dy = origem.top + origem.height / 2 - (final.top + final.height / 2);
  // área visível, nas coordenadas da foto final
  const recorteX = Math.max(0, (final.width - origem.width / escala) / 2);
  const recorteY = Math.max(0, (final.height - origem.height / escala) / 2);
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${escala})`,
    clipPath: `inset(${recorteY}px ${recorteX}px)`,
  };
}

const QUADRO_FINAL = { transform: "translate(0px, 0px) scale(1)", clipPath: "inset(0px 0px)" };

/**
 * Foto do quarto em tela cheia. Abre "saindo" da foto do card (retângulo `origemDe(i)`),
 * permite passar para o lado e, ao fechar, volta para o card da foto que estiver aberta.
 */
export function FotoAmpliada({
  nome,
  imagens,
  caracteristicas = [],
  inicio,
  origemDe,
  aoMudar,
  aoFechar,
}: {
  nome: string;
  imagens: Imagem[];
  /** Mostradas acima da foto, uma a uma, enquanto ela abre. */
  caracteristicas?: string[];
  inicio: number;
  /** Retângulo, na tela, da foto `i` dentro do card (para a animação de ida e volta). */
  origemDe: (i: number) => DOMRect | null;
  /** Chamado ao trocar de foto, para o card acompanhar por trás. */
  aoMudar: (i: number) => void;
  aoFechar: () => void;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const fundo = useRef<HTMLDivElement>(null);
  const controles = useRef<HTMLDivElement>(null);
  const cabecalho = useRef<HTMLDivElement>(null);
  const janela = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(inicio);
  const [fechando, setFechando] = useState(false);
  const varias = imagens.length > 1;

  const fotoNoTrilho = (i: number) =>
    trilho.current?.children[i]?.querySelector("img") as HTMLImageElement | null | undefined;

  // Abertura: posiciona na foto clicada e anima a partir do card.
  useLayoutEffect(() => {
    const el = trilho.current;
    if (el) el.scrollLeft = inicio * el.clientWidth;
    const animacoes: (Animation | undefined)[] = [
      fundo.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 320,
        easing: "ease-out",
      }),
      controles.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 260,
        delay: DURACAO * 0.6,
        easing: "ease-out",
        fill: "backwards",
      }),
    ];
    const img = fotoNoTrilho(inicio);
    const origem = origemDe(inicio);
    if (img && origem && img.complete && img.naturalWidth) {
      animacoes.push(
        img.animate([quadroDeOrigem(img.getBoundingClientRect(), origem), QUADRO_FINAL], {
          duration: DURACAO,
          easing: CURVA,
        }),
      );
    } else {
      animacoes.push(img?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 }));
    }
    // foco na janela (não no X), para não aparecer contorno de seleção no botão
    janela.current?.focus({ preventScroll: true });
    // Se o efeito for desfeito (ex.: modo estrito do React em desenvolvimento roda duas
    // vezes), cancela as animações para a próxima medição partir da posição real.
    return () => animacoes.forEach((a) => a?.cancel());
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fechar = useCallback(() => {
    if (fechando) return;
    setFechando(true);
    const img = fotoNoTrilho(atual);
    const origem = origemDe(atual);
    for (const el of [controles.current, cabecalho.current]) {
      el?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    }
    fundo.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURACAO,
      easing: "ease-in",
      fill: "forwards",
    });
    const animacao =
      img && origem && img.naturalWidth
        ? img.animate([QUADRO_FINAL, quadroDeOrigem(img.getBoundingClientRect(), origem)], {
            duration: DURACAO,
            easing: CURVA,
            fill: "forwards",
          })
        : img?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
    if (animacao) animacao.onfinish = () => aoFechar();
    else aoFechar();
  }, [atual, fechando, origemDe, aoFechar]);

  const irPara = useCallback(
    (i: number) => {
      const el = trilho.current;
      if (!el) return;
      const destino = (i + imagens.length) % imagens.length;
      el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
    },
    [imagens.length],
  );

  // Foto atual acompanha a rolagem (deslizar com o dedo, setas ou teclado).
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const aoRolar = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setAtual(i);
      aoMudar(i);
    };
    el.addEventListener("scroll", aoRolar, { passive: true });
    return () => el.removeEventListener("scroll", aoRolar);
  }, [aoMudar]);

  // Teclado e trava da rolagem da página enquanto está aberta.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      else if (e.key === "ArrowRight" && varias) irPara(atual + 1);
      else if (e.key === "ArrowLeft" && varias) irPara(atual - 1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [fechar, irPara, atual, varias]);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  return createPortal(
    <div
      ref={janela}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos do apartamento ${nome}`}
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center outline-none ${
        fechando ? "pointer-events-none" : ""
      }`}
    >
      <div
        ref={fundo}
        onClick={fechar}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Nome da categoria e características, entrando uma a uma enquanto a foto abre. */}
      <div
        ref={cabecalho}
        className="relative mb-5 flex w-full max-w-xl flex-col items-center px-6 text-center text-white"
      >
        <h2
          className="ampliada-entra font-display text-3xl font-medium leading-tight tracking-tight drop-shadow-md sm:text-4xl"
          style={{ animationDelay: "0.2s" }}
        >
          {nome}
        </h2>
        {caracteristicas.length > 0 && (
          <ul
            className="mt-3 flex flex-wrap justify-center gap-1.5"
            aria-label="Características do quarto"
          >
            {caracteristicas.map((item, i) => {
              const Icone = iconeDaCaracteristica(item);
              return (
                <li
                  key={item}
                  className="ampliada-entra cantos-redondos inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-xs text-white backdrop-blur-sm"
                  style={{ animationDelay: `${0.45 + i * 0.12}s` }}
                >
                  <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="relative w-full">
        <div
          ref={trilho}
          className="flex snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {imagens.map((img, i) => (
            <div
              key={img.src.slice(-40) + i}
              onClick={(e) => e.target === e.currentTarget && fechar()}
              className="flex w-full shrink-0 snap-center items-center justify-center px-4"
            >
              <img
                src={img.src}
                alt={varias ? `${img.alt} (${i + 1} de ${imagens.length})` : img.alt}
                draggable={false}
                className={`${caracteristicas.length ? "max-h-[calc(100dvh-17rem)]" : "max-h-[calc(100dvh-13rem)]"} w-auto max-w-full select-none object-contain shadow-2xl will-change-transform`}
              />
            </div>
          ))}
        </div>

        {varias && (
          <>
            <button
              type="button"
              onClick={() => irPara(atual - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/85 text-2xl text-ink shadow-md transition hover:bg-white md:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => irPara(atual + 1)}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/85 text-2xl text-ink shadow-md transition hover:bg-white md:flex"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div ref={controles} className="relative mt-5 flex flex-col items-center gap-4">
        {varias && (
          <div className="flex gap-1.5" aria-hidden="true">
            {imagens.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 transition-all ${i === atual ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          Foto {atual + 1} de {imagens.length}
        </span>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar fotos"
          className="flex h-12 w-12 items-center justify-center bg-white text-2xl leading-none text-ink shadow-lg outline-none transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  );
}
