import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fotosPadraoDaSecao, FOTOS_PADRAO, resolverUrlFoto } from "./fotos-padrao";
import { ACOMODACOES, COMODIDADES } from "./hotel";

/** Tempo máximo de espera pelo banco nas buscas de fotos; depois disso usa as do repositório. */
const LIMITE_FOTOS_MS = 4000;

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

/** Converte uma linha do banco no formato usado pelo site (url já resolvida). */
function paraFoto<T extends Foto>(f: T): T {
  return { ...f, url: resolverUrlFoto(f.url, f.id) };
}

/** Fotos do repositório no formato de linha do banco, para quando ele não responde. */
function padraoComoFotos(secao: string): Foto[] {
  return fotosPadraoDaSecao(secao).map((f) => ({
    id: f.id,
    url: f.src,
    alt: f.alt,
    ordem: f.ordem,
  }));
}

async function buscarFotos(secao: string): Promise<Foto[]> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_FOTOS_MS);
  try {
    const { data, error } = await supabase
      .from("site_fotos")
      .select("id, url, alt, ordem, chave")
      .eq("secao", secao)
      .order("ordem", { ascending: true })
      .abortSignal(controle.signal);
    if (error || !data) return padraoComoFotos(secao);
    return (data as Foto[]).map(paraFoto);
  } catch {
    return padraoComoFotos(secao);
  } finally {
    clearTimeout(limite);
  }
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

/** Características de cada quarto (ar-condicionado, Wi-Fi...), por slug, em site_config. */
export const CHAVE_CARACTERISTICAS = "caracteristicas-quartos";
export type CaracteristicasQuartos = Record<string, string[]>;
const SEM_CARACTERISTICAS: CaracteristicasQuartos = {};

async function buscarCaracteristicas(): Promise<CaracteristicasQuartos> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_FOTOS_MS);
  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("valor")
      .eq("chave", CHAVE_CARACTERISTICAS)
      .abortSignal(controle.signal)
      .maybeSingle();
    if (error || !data?.valor || typeof data.valor !== "object") return SEM_CARACTERISTICAS;
    const valor = data.valor as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(valor).map(([slug, itens]) => [
        slug,
        Array.isArray(itens)
          ? itens.filter((t): t is string => typeof t === "string" && !!t.trim())
          : [],
      ]),
    );
  } catch {
    return SEM_CARACTERISTICAS;
  } finally {
    clearTimeout(limite);
  }
}

export function useCaracteristicasQuartos() {
  const { data } = useQuery({
    queryKey: ["site_config", CHAVE_CARACTERISTICAS],
    queryFn: buscarCaracteristicas,
    staleTime: 60_000,
  });
  return data ?? SEM_CARACTERISTICAS;
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

function quartosPadrao(): FotoQuarto[] {
  return FOTOS_PADRAO.filter((f) => f.secao.startsWith("quarto-"))
    .sort((a, b) => a.ordem - b.ordem)
    .map((f) => ({ id: f.id, url: f.src, alt: f.alt, ordem: f.ordem, secao: f.secao }));
}

async function buscarFotosQuartos(): Promise<FotoQuarto[]> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_FOTOS_MS);
  try {
    const { data, error } = await supabase
      .from("site_fotos")
      .select("id, url, alt, ordem, chave, secao")
      .or(`secao.eq.${SECAO_QUARTOS_ANTIGA},secao.like.quarto-%`)
      .order("ordem", { ascending: true })
      .abortSignal(controle.signal);
    if (error || !data) return quartosPadrao();
    return (data as FotoQuarto[]).map(paraFoto);
  } catch {
    return quartosPadrao();
  } finally {
    clearTimeout(limite);
  }
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

/** Bucket público do Supabase Storage onde ficam as fotos enviadas pelo painel. */
export const BUCKET_FOTOS = "fotos";

/**
 * Reduz a foto, envia ao Storage e devolve a URL pública (é ela que vai para site_fotos.url).
 * Antes as fotos iam para o banco como texto base64, o que deixava as buscas pesadas.
 */
export async function enviarFoto(file: File, secao: string, maxLado = 1600): Promise<string> {
  const blob = await comprimirImagem(file, maxLado);
  const caminho = `${secao}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(caminho, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl;
}

/** Apaga do Storage o arquivo de uma foto enviada pelo painel (ignora as do repositório). */
export async function removerArquivoFoto(url: string) {
  const marcador = `/storage/v1/object/public/${BUCKET_FOTOS}/`;
  const i = url.indexOf(marcador);
  if (i < 0) return;
  await supabase.storage
    .from(BUCKET_FOTOS)
    .remove([decodeURIComponent(url.slice(i + marcador.length))]);
}

/** Reduz a imagem e devolve um JPEG pronto para enviar. */
function comprimirImagem(file: File, maxLado = 1600, qualidade = 0.82): Promise<Blob> {
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
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Não foi possível converter a foto.")),
          "image/jpeg",
          qualidade,
        );
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
    return resolverUrlFoto(data.url) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
  }
}
