import { createFileRoute } from "@tanstack/react-router";
import areaExterna from "@/assets/area-externa.webp";
import piscina from "@/assets/piscina.jpg";
import { GaleriaSecao } from "@/components/gallery";
import { HOTEL } from "@/lib/hotel";

const TITULO = "O Hotel — Villa di Rimini, Ubatuba";
const DESCRICAO =
  "Hotel de frente para a Praia do Itaguá, com recepção 24h, Wi-Fi grátis, estacionamento privativo, piscina, bar e café da manhã buffet. Pet friendly.";

export const Route = createFileRoute("/o-hotel")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OHotel,
});

const GALERIA_PADRAO = [
  { src: areaExterna, alt: "Área externa com piscina e varanda do Hotel Villa di Rimini" },
  { src: piscina, alt: "Piscina com vista para o mar" },
];

function OHotel() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-surf">O Hotel</div>
      <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] tracking-tight text-ink">
        De frente para o Itaguá
      </h1>

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-2">
        <p>
          De frente para a Praia do Itaguá, no coração de Ubatuba, nosso hotel desfruta de uma
          localização privilegiada, próximo aos melhores restaurantes, lojas e passeios de barco da cidade.
        </p>
        <p>
          A Praia Vermelha e a Praia Grande ficam a apenas 10 minutos de carro. Já o Projeto Tamar e
          o Aquário estão a 5 minutos.
        </p>
        <p>
          A nossa recepção funciona 24 horas e está preparada para auxiliá-los na indicação de
          praias, restaurantes e passeios de barco ou em serviços auxiliares como sessão de massagem,
          lavanderia e aluguel de bicicletas e carros.
        </p>
        <p>O acesso à internet sem fio (Wi-Fi) é gratuito em todas as dependências.</p>
        <p>
          Servimos diariamente um buffet de café da manhã em uma sala de refeições ampla e bem
          iluminada. Você também pode desfrutar de petiscos e bebidas refrescantes em nosso bar ou à
          beira da piscina.
        </p>
        <p>
        </p>
        <p>
          Aqui seu animal de estimação é super bem-vindo: somos um dos poucos hotéis “Pet Friendly”
          do Litoral Norte.
        </p>
      </div>

      <div className="mt-8">
        <GaleriaSecao secao="hotel" padrao={GALERIA_PADRAO} />
      </div>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-2">
        {HOTEL.endereco} · {HOTEL.bairro} · {HOTEL.cidade}/{HOTEL.uf}
      </p>
    </div>
  );
}
