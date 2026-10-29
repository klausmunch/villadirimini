import { createFileRoute, Link } from "@tanstack/react-router";

import fachadaHotel from "@/assets/hotel-fachada.jpg";
import heroVaranda from "@/assets/hero-varanda.webp";
import heroPost from "@/assets/hero-post.webp";
import bannerUbatuba1 from "@/assets/banner-ubatuba-1.webp";
import bannerUbatuba2 from "@/assets/banner-ubatuba-2.webp";
import bannerUbatuba3 from "@/assets/banner-ubatuba-3.webp";
import bannerUbatuba4 from "@/assets/banner-ubatuba-4.webp";
import bannerUbatuba5 from "@/assets/banner-ubatuba-5.webp";
import bannerUbatuba6 from "@/assets/banner-ubatuba-6.webp";
import piscina from "@/assets/piscina.jpg";
import { COMODIDADES, HOTEL } from "@/lib/hotel";
import { FotoContato } from "@/components/foto-contato";
import {
  useBannerConfig,
  useCaracteristicasQuartos,
  useFotosComEstado,
  useFotosQuartos,
} from "@/lib/site-content";

import { RoomCard } from "@/components/room-card";
import { ReservationForm } from "@/components/reservation-form";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { BannerSlideshow } from "@/components/banner-slideshow";

const TITULO = "Hotel Villa di Rimini — Pousada pé na areia em Ubatuba";
const DESCRICAO =
  "Hotel de frente para a Praia do Itaguá, em Ubatuba/SP. Recepção 24h, piscina com bar, café da manhã buffet, Wi-Fi e estacionamento grátis. Pet friendly.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: HOTEL.nome,
          telephone: HOTEL.telefone,
          email: HOTEL.emails[0],
          petsAllowed: true,
          address: {
            "@type": "PostalAddress",
            streetAddress: HOTEL.endereco,
            addressLocality: `${HOTEL.cidade} - ${HOTEL.bairro}`,
            addressRegion: HOTEL.uf,
            addressCountry: "BR",
          },
          amenityFeature: COMODIDADES.map((c) => ({
            "@type": "LocationFeatureSpecification",
            name: c,
            value: true,
          })),
        }),
      },
    ],
  }),
  component: Home,
});

const BANNER_PADRAO_SLIDES = [
  { src: bannerUbatuba1, alt: "Banner promocional: área externa do hotel com piscina" },
  { src: bannerUbatuba2, alt: "Banner promocional: fachada do Hotel Villa di Rimini" },
  { src: bannerUbatuba3, alt: "Banner promocional: vista da varanda para o mar" },
  { src: bannerUbatuba4, alt: "Banner promocional: praia de Ubatuba vista aérea" },
  { src: bannerUbatuba5, alt: "Banner promocional: costa rochosa e mar de Ubatuba" },
  { src: bannerUbatuba6, alt: "Banner promocional: praia de Ubatuba com coqueiro" },
];

function Home() {
  const quartos = useFotosQuartos();
  const caracteristicas = useCaracteristicasQuartos();
  const { fotos: fotosBanner, carregando: carregandoBanner } = useFotosComEstado("banner");
  const { fotos: fotosCafe, carregando: carregandoCafe } = useFotosComEstado("cafe");
  const { intervalo } = useBannerConfig();
  const slides = carregandoBanner
    ? []
    : fotosBanner.length
      ? fotosBanner.map((f) => ({ src: f.url, alt: f.alt || "Hotel Villa di Rimini" }))
      : BANNER_PADRAO_SLIDES;
  return (
    <>
      <section className="w-full">
        <BannerSlideshow slides={slides} interval={intervalo} />
      </section>

      <div className="mx-auto max-w-5xl pb-4">
        <section className="px-0 pt-4 sm:px-4">
          <div className="px-4 sm:px-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-surf">
              (a) · Acomodações
            </div>
            <h2 className="mt-1 font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink">
              Suítes de mar
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {quartos.map((a, i) => (
              <RoomCard
                key={a.slug}
                nome={a.nome}
                detalhe={a.detalhe}
                descricao={a.descricao}
                imagens={a.imagens}
                etiqueta={a.etiqueta}
                caracteristicas={caracteristicas[a.slug] ?? []}
                delay={80 + i * 60}
              />
            ))}
          </div>
        </section>

        <section className="px-0 pt-10 sm:px-4">
          <div className="px-4 sm:px-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-surf">
              (b) · Lazer &amp; café
            </div>
            <h2 className="mt-1 font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink">
              PISCINA, BAR E PETISCOS
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <img
                src={piscina}
                alt="Piscina do hotel com vista para o mar"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover outline-1 -outline-offset-1 outline-black/5 sm:rounded-[12px]"
              />
              {carregandoCafe ? (
                <div
                  className="aspect-[4/5] w-full bg-black/5 sm:rounded-[12px]"
                  aria-hidden="true"
                />
              ) : (
                fotosCafe[0] && (
                  <img
                    src={fotosCafe[0].url}
                    alt={fotosCafe[0].alt || "Café da manhã do Hotel Villa di Rimini"}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover outline-1 -outline-offset-1 outline-black/5 sm:rounded-[12px]"
                  />
                )
              )}
            </div>
            <div className="space-y-3 pt-1">
              <Link to="/lazer" className="block bg-paper-2 p-4 sm:rounded-[12px]">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">
                  Piscina &amp; bar
                </div>
                <p className="mt-1.5 text-sm leading-snug text-ink">
                  Piscina e bar para petiscos e bebidas geladas.
                </p>
              </Link>
              <Link to="/cafe-da-manha" className="block bg-paper-2 p-4 sm:rounded-[12px]">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">
                  Café da manhã
                </div>
                <p className="mt-1.5 text-sm leading-snug text-ink">
                  Buffet servido diariamente em sala de refeições ampla e iluminada.
                </p>
              </Link>
              <div className="relative overflow-hidden bg-ink p-4 text-paper sm:rounded-[12px]">
                <div className="wave pointer-events-none absolute inset-0 opacity-60" />
                <div className="relative">
                  <div className="inline-block -rotate-2 bg-surf px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-paper sm:rounded-sm">
                    Pet friendly
                  </div>
                  <p className="mt-2 text-sm leading-snug text-paper">
                    Um dos poucos hotéis do Litoral Norte que recebe o seu pet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-0 pt-10 sm:px-4">
          <div className="px-4 sm:px-1">
            <div className="animate-rise font-mono text-[10px] uppercase tracking-[0.25em] text-surf">
              (c) · Localização
            </div>
          </div>
          <div className="mt-3 overflow-hidden outline-1 -outline-offset-1 outline-black/5 sm:rounded-[14px]">
            <iframe
              title="Localização do Hotel Villa di Rimini no mapa"
              src="https://www.google.com/maps?q=Av.+Leovigildo+Dias+Vieira,+1140+-+Itagu%C3%A1,+Ubatuba+-+SP&z=16&output=embed"
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="flex items-center justify-between gap-3 bg-paper-2 p-4">
              <p className="text-sm leading-snug text-ink">
                {HOTEL.endereco} · {HOTEL.bairro}, {HOTEL.cidade}/{HOTEL.uf}
              </p>
              <a
                href={HOTEL.mapa}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 font-mono text-[11px] uppercase tracking-[0.15em] text-surf"
              >
                Abrir no Maps →
              </a>
            </div>
          </div>
          <p className="mt-3 max-w-[46ch] px-4 text-pretty text-sm leading-relaxed text-ink-2 sm:px-1">
            O Projeto Tamar e o Aquário ficam a 5 minutos; as praias Vermelha e Grande, a 10 minutos
            de carro.
          </p>
          <Link
            to="/o-hotel"
            className="mt-3 inline-block px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-surf sm:px-1"
          >
            Conhecer o hotel →
          </Link>
        </section>

        <section className="mt-5 px-0 sm:px-4">
          <div className="relative overflow-hidden outline-1 -outline-offset-1 outline-black/5 sm:rounded-[16px]">
            <HeroSlideshow
              slides={[
                {
                  src: fachadaHotel,
                  alt: "Fachada do Hotel Villa di Rimini na Avenida do Itaguá, em Ubatuba",
                },
                {
                  src: heroVaranda,
                  alt: "Vista da varanda do Hotel Villa di Rimini para a Praia do Itaguá, em Ubatuba",
                },
                {
                  src: heroPost,
                  alt: "Vista aérea da Praia do Itaguá e do Hotel Villa di Rimini em Ubatuba",
                },
              ]}
              interval={5000}
            />

            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink/10 to-transparent" />
          </div>

          <div className="px-4 pt-4 sm:px-0">
            <p className="mt-4 max-w-[40ch] animate-rise text-pretty text-sm leading-relaxed text-ink-2 [animation-delay:160ms]">
              De frente para a Praia do Itaguá. &nbsp;Recepção 24h, piscina, café da manhã buffet e
              opções com varanda aberta para o mar.
            </p>
          </div>
        </section>

        <section className="mt-5 px-0 sm:px-4">
          <ReservationForm />
        </section>

        <section className="px-0 pb-4 pt-10 sm:px-4">
          <div className="px-4 sm:px-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-surf">
              (d) · Contato
            </div>
            <h2 className="mt-1 font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink">
              Fale com a recepção
            </h2>
          </div>

          <div className="mt-4 overflow-hidden bg-paper-2 outline-1 -outline-offset-1 outline-black/5 sm:rounded-[14px]">
            <a href={HOTEL.mapa} target="_blank" rel="noreferrer">
              <FotoContato />
            </a>
            <div className="p-4">
              <div className="text-sm leading-snug text-ink">
                {HOTEL.endereco}
                <br />
                {HOTEL.bairro} · {HOTEL.cidade} / {HOTEL.uf}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-2">
                <a href={HOTEL.telefoneLink}>{HOTEL.telefone}</a>
                <a href={`mailto:${HOTEL.emails[0]}`}>{HOTEL.emails[0]}</a>
              </div>
              <a
                href={HOTEL.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 bg-ink py-3.5 text-sm font-semibold text-paper active:opacity-90 sm:rounded-md"
              >
                <span className="inline-block size-2 bg-surf sm:rounded-full" />
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
