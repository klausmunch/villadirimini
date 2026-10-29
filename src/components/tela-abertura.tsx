import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFotosQuartosComEstado } from "@/lib/site-content";

const FUNDO_PADRAO = "/abertura/fundo.webp"; // já vem desfocada

// Linha do tempo da animação (segundos desde que a página aparece).
const TITULO = "Ubatuba te espera.";
const SUBTITULO = "Sua reserva está a poucos cliques.";
const TITULO_INICIO = 0.9;
const TITULO_PASSO = 0.04; // intervalo entre uma letra e a próxima
const SUBTITULO_INICIO = TITULO_INICIO + TITULO.length * TITULO_PASSO * 0.6;
const SUBTITULO_PASSO = 0.025;
const FIM_DO_TEXTO = SUBTITULO_INICIO + SUBTITULO.length * SUBTITULO_PASSO + 0.5;

const TEMPO_MAXIMO = 4000; // o botão aparece mesmo que as fotos (ou o banco) demorem mais que isso
const DURACAO_SAIDA = 900; // a tela sobe e revela o site

/** Pré-carrega as imagens; resolve mesmo se alguma falhar. */
function preCarregar(urls: string[]) {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  );
}

/**
 * Tela de abertura: foto desfocada do hotel, logo e chamada. Vem no HTML do servidor
 * (aparece antes do JavaScript) e enquanto isso as fotos dos quartos são baixadas.
 * O botão "continuar" surge quando o site está pronto.
 */
export function TelaAbertura({ fundo }: { fundo: string | null }) {
  const { pathname } = useLocation();
  const [ignorar] = useState(() => /^\/(admin|auth)/.test(pathname));
  const { quartos, carregando } = useFotosQuartosComEstado();
  // a primeira foto de cada quarto é a que aparece de cara; as demais carregam depois
  const primeiras = quartos.flatMap((q) => q.imagens.slice(0, 1).map((i) => i.src));
  const [hidratada, setHidratada] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [removida, setRemovida] = useState(false);

  useEffect(() => setHidratada(true), []);

  // Limite total contado desde a abertura: mesmo que o banco esteja lento ou fora
  // do ar (e a busca fique tentando de novo), o botão aparece.
  useEffect(() => {
    if (ignorar) return;
    const t = setTimeout(() => setPronta(true), TEMPO_MAXIMO);
    return () => clearTimeout(t);
  }, [ignorar]);

  useEffect(() => {
    if (ignorar || carregando) return;
    let cancelado = false;
    preCarregar(primeiras).then(() => {
      if (!cancelado) setPronta(true);
    });
    return () => {
      cancelado = true;
    };
    // primeiras deriva das fotos; basta reagir quando a busca termina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ignorar, carregando]);

  useEffect(() => {
    if (!saindo) return;
    const t = setTimeout(() => setRemovida(true), DURACAO_SAIDA);
    return () => clearTimeout(t);
  }, [saindo]);

  useEffect(() => {
    if (ignorar || removida) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [ignorar, removida]);

  // O botão entra por último: se as fotos ficarem prontas antes do texto terminar, ele espera.
  const atrasoBotao =
    typeof performance === "undefined" ? 0 : Math.max(0.1, FIM_DO_TEXTO - performance.now() / 1000);

  function continuar() {
    setSaindo(true);
  }

  if (ignorar || removida) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boas-vindas ao Hotel Villa di Rimini"
      className={`tela-abertura fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-surf px-6 text-center font-display text-white transition-transform duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        hidratada ? "tela-abertura--hidratada" : ""
      } ${saindo ? "pointer-events-none -translate-y-full" : "translate-y-0"}`}
    >
      {/* A foto vem do servidor junto com a página; a enviada no painel é desfocada aqui. */}
      <img
        src={fundo ?? FUNDO_PADRAO}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover ${
          fundo ? "scale-125 blur-[18px]" : "scale-110"
        }`}
      />
      <div className="absolute inset-0 bg-black/10" aria-hidden="true" />

      <div className="relative flex flex-col items-center">
        <img
          src="/abertura/logo.webp"
          alt="Hotel Villa di Rimini"
          className="abertura-fade w-[min(62vw,300px)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
          style={{ animationDelay: `${TITULO_INICIO - 0.6}s` }}
        />

        <h1 className="mt-14 text-[clamp(1.9rem,8vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.01em]">
          <Linha texto={TITULO} inicio={TITULO_INICIO} passo={TITULO_PASSO} />
        </h1>
        <p className="mt-1 text-[clamp(1.05rem,4.4vw,1.4rem)] font-medium leading-tight">
          <Linha
            texto={SUBTITULO}
            inicio={SUBTITULO_INICIO}
            passo={SUBTITULO_PASSO}
            className="abertura-barra--menta"
          />
        </p>

        <div className="mt-16 flex h-12 items-center">
          {pronta ? (
            <button
              type="button"
              onClick={continuar}
              className="abertura-barra abertura-barra--cheia group px-1 text-[clamp(1.2rem,5vw,1.5rem)] font-semibold leading-none outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              style={{ animationDelay: `${atrasoBotao}s` }}
            >
              <span
                className="abertura-fade inline-block"
                style={{ animationDelay: `${atrasoBotao + 0.15}s` }}
              >
                continuar
                <span
                  aria-hidden="true"
                  className="ml-3 inline-block transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </button>
          ) : (
            <span className="abertura-carregando" role="status" aria-label="Carregando o site" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Uma linha de texto com a faixa colorida crescendo da esquerda para a direita
 * enquanto as letras aparecem uma a uma.
 */
function Linha({
  texto,
  inicio,
  passo,
  className = "",
}: {
  texto: string;
  inicio: number;
  passo: number;
  className?: string;
}) {
  const duracaoBarra = texto.length * passo + 0.3;
  return (
    <span
      className={`abertura-barra ${className}`}
      style={{ animationDelay: `${inicio}s`, animationDuration: `${duracaoBarra}s` }}
    >
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {texto.split(" ").map((palavra, p, palavras) => {
          // índice global da primeira letra da palavra (espaços contam no ritmo)
          const base = palavras.slice(0, p).join(" ").length + (p > 0 ? 1 : 0);
          return (
            <span key={p}>
              {p > 0 && " "}
              <span className="whitespace-nowrap">
                {[...palavra].map((letra, i) => (
                  <span
                    key={i}
                    className="abertura-letra"
                    style={{ animationDelay: `${inicio + 0.1 + (base + i) * passo}s` }}
                  >
                    {letra}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
