// Fotos oficiais guardadas no repositório (servidas pela Vercel).
// Cada uma corresponde a uma linha de site_fotos pelo `id`. Linhas com url "static:<id>"
// apontam para cá; se o banco estiver fora do ar, o site usa esta lista diretamente.
// Gerado a partir das fotos do painel em 29/10/2026.
import foto_banner_45857b50 from "@/assets/fotos/banner-45857b50.webp";
import foto_banner_0c04d779 from "@/assets/fotos/banner-0c04d779.webp";
import foto_banner_58b83ce0 from "@/assets/fotos/banner-58b83ce0.webp";
import foto_banner_a47807ba from "@/assets/fotos/banner-a47807ba.webp";
import foto_banner_dfc0a056 from "@/assets/fotos/banner-dfc0a056.webp";
import foto_banner_585c5311 from "@/assets/fotos/banner-585c5311.webp";
import foto_hotel_4b687c10 from "@/assets/fotos/hotel-4b687c10.webp";
import foto_hotel_be37553b from "@/assets/fotos/hotel-be37553b.webp";
import foto_quarto_duplo_c01e71b1 from "@/assets/fotos/quarto-duplo-c01e71b1.webp";
import foto_quarto_familia_aef2e12a from "@/assets/fotos/quarto-familia-aef2e12a.webp";
import foto_quarto_mar_627b8830 from "@/assets/fotos/quarto-mar-627b8830.webp";

export type FotoPadrao = { id: string; secao: string; ordem: number; alt: string; src: string };

export const FOTOS_PADRAO: FotoPadrao[] = [
  { id: "45857b50-aad2-49f4-8cb1-4193a82f4086", secao: "banner", ordem: 0, alt: "Hotel Villa di Rimini", src: foto_banner_45857b50 },
  { id: "0c04d779-540c-4f80-a654-c6e723524127", secao: "banner", ordem: 1, alt: "Hotel Villa di Rimini", src: foto_banner_0c04d779 },
  { id: "58b83ce0-06d1-440c-b6e0-e0099df33fdb", secao: "banner", ordem: 2, alt: "Hotel Villa di Rimini", src: foto_banner_58b83ce0 },
  { id: "a47807ba-a9df-48b4-bbee-223722de2bf5", secao: "banner", ordem: 3, alt: "Hotel Villa di Rimini", src: foto_banner_a47807ba },
  { id: "dfc0a056-e7b8-4153-a767-efc2334c8139", secao: "banner", ordem: 4, alt: "Hotel Villa di Rimini", src: foto_banner_dfc0a056 },
  { id: "585c5311-ef63-4ad5-a6e9-c9e8113eef5f", secao: "banner", ordem: 5, alt: "Hotel Villa di Rimini", src: foto_banner_585c5311 },
  { id: "4b687c10-b72d-4769-9730-eb8046764f7e", secao: "hotel", ordem: 0, alt: "Hotel Villa di Rimini", src: foto_hotel_4b687c10 },
  { id: "be37553b-5c02-4b84-ad85-62d2e88a6580", secao: "hotel", ordem: 1, alt: "Praia Grande", src: foto_hotel_be37553b },
  { id: "c01e71b1-9d7f-4224-8374-2090239cdba8", secao: "quarto-duplo", ordem: -1, alt: "Apartamento Duplo", src: foto_quarto_duplo_c01e71b1 },
  { id: "aef2e12a-19cb-4997-82d4-8224d3eba236", secao: "quarto-familia", ordem: -1, alt: "Apartamento Família", src: foto_quarto_familia_aef2e12a },
  { id: "627b8830-625c-426e-97cc-1460ed527723", secao: "quarto-mar", ordem: -1, alt: "Apartamento Duplo vista mar", src: foto_quarto_mar_627b8830 },
];

const POR_ID = new Map(FOTOS_PADRAO.map((f) => [f.id, f]));

/** Prefixo da url no banco que indica uma foto guardada no repositório. */
export const PREFIXO_ESTATICO = "static:";

/** Converte a url guardada no banco no endereço que o navegador deve carregar. */
export function resolverUrlFoto(url: string, id?: string): string {
  if (url.startsWith(PREFIXO_ESTATICO)) return POR_ID.get(url.slice(PREFIXO_ESTATICO.length))?.src ?? "";
  // linhas antigas (texto base64) que já têm cópia no repositório
  if (url.startsWith("data:") && id && POR_ID.has(id)) return POR_ID.get(id)!.src;
  return url;
}

/** Fotos padrão de uma seção, na ordem (usadas quando o banco não responde). */
export function fotosPadraoDaSecao(secao: string): FotoPadrao[] {
  return FOTOS_PADRAO.filter((f) => f.secao === secao).sort((a, b) => a.ordem - b.ordem);
}
