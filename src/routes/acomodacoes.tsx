import { createFileRoute } from "@tanstack/react-router";
import { useCaracteristicasQuartos, useFotosQuartos } from "@/lib/site-content";
import { RoomCard } from "@/components/room-card";
import { ReservationForm } from "@/components/reservation-form";

const TITULO = "Acomodações — Hotel Villa di Rimini, Ubatuba";
const DESCRICAO =
  "Apartamentos duplo, vista mar e família no Hotel Villa di Rimini, em frente à Praia do Itaguá, em Ubatuba. Reserve online.";

export const Route = createFileRoute("/acomodacoes")({
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
  component: Acomodacoes,
});

function Acomodacoes() {
  const quartos = useFotosQuartos();
  const caracteristicas = useCaracteristicasQuartos();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-surf">
        Acomodações
      </div>
      <h1 className="mt-1 px-1 font-display text-5xl uppercase leading-[0.95] tracking-tight text-ink">
        Escolha o seu quarto
      </h1>

      <div className="mt-6 space-y-3">
        {quartos.map((a, i) => (
          <RoomCard
            key={a.slug}
            nome={a.nome}
            detalhe={a.detalhe}
            descricao={a.descricao}
            imagens={a.imagens}
            etiqueta={a.etiqueta}
            caracteristicas={caracteristicas[a.slug] ?? []}
            delay={60 + i * 60}
          />
        ))}
      </div>

      <div className="mt-8">
        <ReservationForm />
      </div>
    </div>
  );
}
