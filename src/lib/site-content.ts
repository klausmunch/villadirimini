import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACOMODACOES, COMODIDADES } from "./hotel";

export type MarqueeConfig = { itens: string[]; segundos: number };

export const MARQUEE_PADRAO: MarqueeConfig = { itens: COMODIDADES, segundos: 18 };

export type Foto = { id?: string; url: string; alt: string; ordem: number; chave?: string | null };

export const FOTOS_HOTEL_PADRAO: Foto[] = [];

// Referência estável: um `[]` novo a cada render dispara loops em useEffect([fotos]).
const SEM_FOTOS: Foto[] = [];

export type BannerConfig = { intervalo: number };
export const BANNER_PADRAO: BannerConfig = { intervalo: 3000 };

async function buscarBanner(): Promise<BannerConfig> {
  const { data, error } = await supabase
    .from("site_config")
    .select("valor")
    .eq("chave", "banner")
    .maybeSingle();
  if (error || !data) return BANNER_PADRAO;
  const valor = data.valor as Partial<BannerConfig> | null;
  const intervalo = Number(valor?.intervalo);
  return { intervalo: intervalo > 0 ? intervalo : BANNER_PADRAO.intervalo };
}

export function useBannerConfig() {
  const { data } = useQuery({
    queryKey: ["site_config", "banner"],
    queryFn: buscarBanner,
    staleTime: 60_000,
  });
  return data ?? BANNER_PADRAO;
}

async function buscarMarquee(): Promise<MarqueeConfig> {
  const { data, error } = await supabase
    .from("site_config")
    .select("valor")
    .eq("chave", "marquee")
    .maybeSingle();
  if (error || !data) return MARQUEE_PADRAO;
  const valor = data.valor as Partial<MarqueeConfig> | null;
  return {
    itens: Array.isArray(valor?.itens) && valor.itens.length ? valor.itens : MARQUEE_PADRAO.itens,
    segundos: Number(valor?.segundos) > 0 ? Number(valor?.segundos) : MARQUEE_PADRAO.segundos,
  };
}

export function useMarquee() {
  const { data } = useQuery({
    queryKey: ["site_config", "marquee"],
    queryFn: buscarMarquee,
    staleTime: 60_000,
  });
  return data ?? MARQUEE_PADRAO;
}

async function buscarFotos(secao: string): Promise<Foto[]> {
  const { data, error } = await supabase
    .from("site_fotos")
    .select("id, url, alt, ordem, chave")
    .eq("secao", secao)
    .order("ordem", { ascending: true });
  if (error || !data) return [];
  return data as Foto[];
}

export function useFotos(secao: string) {
  return useFotosComEstado(secao).fotos;
}

/** Fotos da seção e se a busca já terminou (para não exibir imagens provisórias). */
export function useFotosComEstado(secao: string) {
  const { data, isPending } = useQuery({
    queryKey: ["site_fotos", secao],
    queryFn: () => buscarFotos(secao),
    staleTime: 60_000,
  });
  return { fotos: data ?? SEM_FOTOS, carregando: isPending };
}

/** Máximo de fotos por quarto. */
export const MAX_FOTOS_QUARTO = 5;

/** Seção onde ficam as fotos de um quarto (uma linha por foto, sem `chave`). */
export function secaoQuarto(slug: string) {
  return `quarto-${slug}`;
}

/** Formato antigo: uma única foto por quarto em secao "quartos", chave = slug. */
export const SECAO_QUARTOS_ANTIGA = "quartos";

export type FotoQuarto = Foto & { secao: string };

async function buscarFotosQuartos(): Promise<FotoQuarto[]> {
  const { data, error } = await supabase
    .from("site_fotos")
    .select("id, url, alt, ordem, chave, secao")
    .or(`secao.eq.${SECAO_QUARTOS_ANTIGA},secao.like.quarto-%`)
    .order("ordem", { ascending: true });
  if (error || !data) return [];
  return data as FotoQuarto[];
}

/** Fotos de todos os quartos (formato novo e antigo) numa única busca. */
export function useFotosQuartosComEstado() {
  const { data, isPending } = useQuery({
    queryKey: ["site_fotos", "quartos-todos"],
    queryFn: buscarFotosQuartos,
    staleTime: 60_000,
  });
  const fotos = data ?? (SEM_FOTOS as FotoQuarto[]);
  const quartos = ACOMODACOES.map((a) => {
    const antiga = fotos.filter((f) => f.secao === SECAO_QUARTOS_ANTIGA && f.chave === a.slug);
    const novas = fotos.filter((f) => f.secao === secaoQuarto(a.slug));
    const lista = [...antiga, ...novas].slice(0, MAX_FOTOS_QUARTO);
    return {
      ...a,
      fotos: lista,
      imagens: lista.map((f) => ({ src: f.url, alt: f.alt || `Apartamento ${a.nome}` })),
    };
  });
  return { quartos, carregando: isPending };
}

/** Quartos com suas fotos (`imagens` vazio enquanto carrega ou se não houver foto). */
export function useFotosQuartos() {
  return useFotosQuartosComEstado().quartos;
}

/** Reduz a imagem e devolve um JPEG em data URL, pronto para salvar. */
export function comprimirImagem(file: File, maxLado = 1600, qualidade = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Navegador não suportado."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Seção do painel admin com a foto de fundo da tela de abertura (usa a primeira). */
export const SECAO_FUNDO_ABERTURA = "abertura";

/**
 * URL da foto de fundo enviada no painel, ou null. Usada no loader da rota raiz:
 * roda no servidor, então a foto já vem no HTML e a abertura não espera por ela.
 */
const LIMITE_FUNDO_MS = 1500;

export async function buscarFundoAbertura(): Promise<string | null> {
  // Roda antes de a página ser enviada: se o banco demorar ou estiver fora,
  // desiste logo e usa o fundo padrão, em vez de travar a página inteira.
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_FUNDO_MS);
  try {
    const { data, error } = await supabase
      .from("site_fotos")
      .select("url")
      .eq("secao", SECAO_FUNDO_ABERTURA)
      .order("ordem", { ascending: true })
      .limit(1)
      .abortSignal(controle.signal)
      .maybeSingle();
    if (error || !data) return null;
    return data.url;
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
  }
}
