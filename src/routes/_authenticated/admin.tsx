import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ehDevAdmin, sairDevAdmin } from "@/lib/dev-admin";
import {
  enviarFoto,
  removerArquivoFoto,
  MARQUEE_PADRAO,
  useBannerConfig,
  MAX_FOTOS_QUARTO,
  SECAO_FUNDO_ABERTURA,
  SECAO_QUARTOS_ANTIGA,
  secaoQuarto,
  useFotos,
  useFotosQuartosComEstado,
  useMarquee,
} from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Hotel Villa di Rimini" },
      { name: "description", content: "Painel de administração do site do hotel." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Administração — Hotel Villa di Rimini" },
      { property: "og:description", content: "Painel de administração do site do hotel." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ehAdmin, isLoading: carregandoPapel } = useQuery({
    queryKey: ["admin", "role"],
    queryFn: async () => {
      if (ehDevAdmin()) return true;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    sairDevAdmin();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-tight text-ink">Administração</h1>
        <button
          type="button"
          onClick={sair}
          className="font-mono text-[11px] uppercase tracking-[0.15em] text-surf"
        >
          Sair →
        </button>
      </div>

      {ehDevAdmin() && (
        <p className="mt-4 border border-line bg-paper-2 px-3 py-2 text-sm text-ink-2">
          Modo de teste local (admin/admin). Você pode navegar pelo painel, mas salvar alterações
          exige uma conta de administrador real no Supabase.
        </p>
      )}

      {carregandoPapel ? (
        <p className="mt-6 text-sm text-ink-2">Carregando...</p>
      ) : !ehAdmin ? (
        <p className="mt-6 text-sm text-ink-2">Esta conta não tem permissão de administrador.</p>
      ) : (
        <div className="mt-8 space-y-12">
          <PainelMarquee />
          <PainelBanner />
          <PainelQuartos />
          <PainelHotel />
          <PainelPaginas />
        </div>
      )}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl uppercase tracking-tight text-ink">{children}</h2>;
}

function PainelMarquee() {
  const queryClient = useQueryClient();
  const config = useMarquee();
  const [itens, setItens] = useState<string[]>(config.itens);
  const [segundos, setSegundos] = useState(config.segundos);
  const [estado, setEstado] = useState<string | null>(null);

  useEffect(() => {
    setItens(config.itens);
    setSegundos(config.segundos);
  }, [config]);

  async function salvar() {
    setEstado("Salvando...");
    const limpos = itens.map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("site_config").upsert(
      {
        chave: "marquee",
        valor: { itens: limpos.length ? limpos : MARQUEE_PADRAO.itens, segundos },
      },
      { onConflict: "chave" },
    );
    if (error) return setEstado("Erro ao salvar: " + error.message);
    await queryClient.invalidateQueries({ queryKey: ["site_config", "marquee"] });
    setEstado("Salvo!");
  }

  return (
    <section>
      <Titulo>Faixa de comodidades</Titulo>
      <div className="mt-4 space-y-2">
        {itens.map((texto, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={texto}
              onChange={(e) => setItens(itens.map((t, idx) => (idx === i ? e.target.value : t)))}
              className="w-full border border-line bg-paper-2 px-3 py-2.5 text-sm text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setItens(itens.filter((_, idx) => idx !== i))}
              className="shrink-0 border border-line px-3 font-mono text-[11px] uppercase text-ink-2"
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItens([...itens, ""])}
          className="font-mono text-[11px] uppercase tracking-[0.15em] text-surf"
        >
          + Adicionar texto
        </button>
      </div>

      <div className="mt-6">
        <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-2">
          Velocidade do movimento — {segundos}s por volta (
          {segundos <= 12 ? "rápido" : segundos >= 30 ? "lento" : "médio"})
        </label>
        <input
          type="range"
          min={5}
          max={60}
          step={1}
          value={segundos}
          onChange={(e) => setSegundos(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={salvar}
          className="bg-ink px-5 py-3 text-sm font-semibold text-paper"
        >
          Salvar faixa
        </button>
        {estado && <span className="text-sm text-ink-2">{estado}</span>}
      </div>
    </section>
  );
}

function PainelQuartos() {
  const queryClient = useQueryClient();
  const { quartos } = useFotosQuartosComEstado();

  // Converte a foto única do formato antigo (secao "quartos") para a galeria do quarto,
  // como primeira foto. Roda uma vez quando houver alguma no formato antigo.
  const antigas = quartos.flatMap((q) =>
    q.fotos
      .filter((f) => f.secao === SECAO_QUARTOS_ANTIGA)
      .map((f) => ({ id: f.id, slug: q.slug })),
  );
  const chaveAntigas = antigas.map((a) => a.id).join(",");
  useEffect(() => {
    if (!antigas.length || ehDevAdmin()) return;
    void (async () => {
      for (const a of antigas) {
        if (!a.id) continue;
        await supabase
          .from("site_fotos")
          .update({ secao: secaoQuarto(a.slug), chave: null, ordem: -1 })
          .eq("id", a.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["site_fotos"] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveAntigas]);

  return (
    <section>
      <Titulo>Fotos dos quartos</Titulo>
      <p className="mt-2 text-sm text-ink-2">
        Até {MAX_FOTOS_QUARTO} fotos por quarto. A primeira aparece de cara; as outras o visitante
        vê deslizando para o lado (ou pelas setas).
      </p>
      <div className="mt-4 space-y-8">
        {quartos.map((q) => (
          <div key={q.slug}>
            {q.fotos
              .filter((f) => f.secao === SECAO_QUARTOS_ANTIGA)
              .map((f) => (
                <div
                  key={f.id}
                  className="mb-3 flex items-center gap-3 bg-paper-2 p-2 text-xs text-ink-2"
                >
                  <img src={f.url} alt="" className="h-12 w-16 shrink-0 object-cover" />
                  Foto atual de {q.nome} (formato antigo). Ela entra nesta galeria como primeira
                  foto assim que um administrador real abrir este painel.
                </div>
              ))}
            <GaleriaFotos
              secao={secaoQuarto(q.slug)}
              titulo={q.nome}
              subtitulo
              maximo={MAX_FOTOS_QUARTO}
              altPadrao={`Apartamento ${q.nome}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function GaleriaFotos({
  secao,
  titulo,
  descricao,
  subtitulo = false,
  maximo,
  altPadrao = "Hotel Villa di Rimini",
  maxLado,
  previaDesfocada = false,
}: {
  secao: string;
  titulo: string;
  descricao?: string;
  /** Título menor, para galerias agrupadas dentro de outra seção. */
  subtitulo?: boolean;
  maximo?: number;
  altPadrao?: string;
  /** Lado maior (px) ao reduzir a foto no envio. */
  maxLado?: number;
  /** Mostra a prévia já desfocada, como aparece no site. */
  previaDesfocada?: boolean;
}) {
  const queryClient = useQueryClient();
  const fotos = useFotos(secao);
  const [estado, setEstado] = useState<string | null>(null);
  const [textos, setTextos] = useState<Record<string, string>>({});

  useEffect(() => {
    setTextos(Object.fromEntries(fotos.map((f) => [f.id as string, f.alt])));
  }, [fotos]);

  async function atualizar() {
    // prefixo: atualiza também buscas combinadas (ex.: todas as fotos dos quartos)
    await queryClient.invalidateQueries({ queryKey: ["site_fotos"] });
  }

  const vagas = maximo === undefined ? Infinity : Math.max(0, maximo - fotos.length);

  async function adicionar(arquivos: File[]) {
    const enviar = arquivos.slice(0, vagas);
    if (!enviar.length) return;
    const ignoradas = arquivos.length - enviar.length;
    setEstado(enviar.length > 1 ? `Enviando ${enviar.length} fotos...` : "Enviando foto...");
    try {
      let ordem = fotos.length ? Math.max(...fotos.map((f) => f.ordem)) + 1 : 0;
      for (const file of enviar) {
        const url = await enviarFoto(file, secao, maxLado);
        const { error } = await supabase
          .from("site_fotos")
          .insert({ secao, url, alt: altPadrao, ordem: ordem++ });
        if (error) {
          await removerArquivoFoto(url); // não deixa arquivo órfão no Storage
          throw error;
        }
      }
      await atualizar();
      setEstado(
        (enviar.length > 1 ? `${enviar.length} fotos adicionadas!` : "Foto adicionada!") +
          (ignoradas ? ` ${ignoradas} ficaram de fora (limite de ${maximo}).` : ""),
      );
    } catch (err) {
      setEstado(err instanceof Error ? err.message : "Erro ao enviar a foto.");
    }
  }

  async function remover(id: string) {
    const url = fotos.find((f) => f.id === id)?.url;
    const { error } = await supabase.from("site_fotos").delete().eq("id", id);
    if (error) return setEstado("Erro ao remover: " + error.message);
    if (url) await removerArquivoFoto(url);
    await atualizar();
    setEstado("Foto removida.");
  }

  async function salvarTexto(id: string) {
    const alt = (textos[id] ?? "").trim();
    const { error } = await supabase.from("site_fotos").update({ alt }).eq("id", id);
    if (error) return setEstado("Erro ao salvar o texto: " + error.message);
    await atualizar();
    setEstado("Texto salvo!");
  }

  async function mover(index: number, direcao: -1 | 1) {
    const a = fotos[index];
    const b = fotos[index + direcao];
    if (!a?.id || !b?.id) return;
    await supabase.from("site_fotos").update({ ordem: b.ordem }).eq("id", a.id);
    await supabase.from("site_fotos").update({ ordem: a.ordem }).eq("id", b.id);
    await atualizar();
    setEstado("Ordem atualizada.");
  }

  return (
    <section>
      {subtitulo ? (
        <h3 className="font-display text-xl leading-none text-ink">
          {titulo}
          {maximo !== undefined && (
            <span className="ml-2 font-mono text-[11px] text-ink-2">
              {fotos.length}/{maximo}
            </span>
          )}
        </h3>
      ) : (
        <Titulo>{titulo}</Titulo>
      )}
      {descricao && <p className="mt-2 text-sm text-ink-2">{descricao}</p>}
      {estado && <p className="mt-2 text-sm text-ink-2">{estado}</p>}

      {vagas > 0 ? (
        <input
          type="file"
          accept="image/*"
          multiple={vagas > 1}
          onChange={(e) => {
            const lista = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (lista.length) void adicionar(lista);
          }}
          className="mt-4 block w-full text-xs text-ink-2"
        />
      ) : (
        <p className="mt-3 text-xs text-ink-2">
          Limite de {maximo} fotos atingido. Remova uma para enviar outra.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {fotos.map((f, i) => (
          <div key={f.id} className="flex gap-3 border border-line p-3">
            <div className="h-24 w-32 shrink-0 overflow-hidden">
              <img
                src={f.url}
                alt={f.alt}
                className={`h-full w-full object-cover ${previaDesfocada ? "scale-125 blur-[6px]" : ""}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={textos[f.id as string] ?? ""}
                onChange={(e) => setTextos({ ...textos, [f.id as string]: e.target.value })}
                placeholder="Texto da foto"
                className="w-full border border-line bg-paper-2 px-3 py-2 text-sm text-ink outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em]">
                <button
                  type="button"
                  onClick={() => f.id && void salvarTexto(f.id)}
                  className="text-surf"
                >
                  Salvar texto
                </button>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => void mover(i, -1)}
                  className="text-ink-2 disabled:opacity-30"
                >
                  ↑ Subir
                </button>
                <button
                  type="button"
                  disabled={i === fotos.length - 1}
                  onClick={() => void mover(i, 1)}
                  className="text-ink-2 disabled:opacity-30"
                >
                  ↓ Descer
                </button>
                <button
                  type="button"
                  onClick={() => f.id && void remover(f.id)}
                  className="text-surf"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PainelBanner() {
  const queryClient = useQueryClient();
  const { intervalo } = useBannerConfig();
  const [segundos, setSegundos] = useState(intervalo / 1000);
  const [estado, setEstado] = useState<string | null>(null);

  useEffect(() => {
    setSegundos(intervalo / 1000);
  }, [intervalo]);

  async function salvar() {
    setEstado("Salvando...");
    const { error } = await supabase
      .from("site_config")
      .upsert(
        { chave: "banner", valor: { intervalo: Math.round(segundos * 1000) } },
        { onConflict: "chave" },
      );
    if (error) return setEstado("Erro ao salvar: " + error.message);
    await queryClient.invalidateQueries({ queryKey: ["site_config", "banner"] });
    setEstado("Salvo!");
  }

  return (
    <div className="space-y-6">
      <GaleriaFotos
        secao="banner"
        titulo="Fotos do banner (topo da home)"
        descricao="Enquanto nenhuma foto for enviada aqui, o site mostra as imagens originais do banner."
      />
      <div>
        <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-2">
          Intervalo entre as fotos — {segundos}s
        </label>
        <input
          type="range"
          min={1}
          max={15}
          step={1}
          value={segundos}
          onChange={(e) => setSegundos(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={salvar}
            className="bg-ink px-5 py-3 text-sm font-semibold text-paper"
          >
            Salvar intervalo
          </button>
          {estado && <span className="text-sm text-ink-2">{estado}</span>}
        </div>
      </div>
    </div>
  );
}

function PainelHotel() {
  return (
    <GaleriaFotos
      secao="hotel"
      titulo="Fotos da página “O Hotel”"
      descricao="Enquanto nenhuma foto for enviada aqui, a página mostra as fotos da área externa e da piscina."
    />
  );
}

function PainelPaginas() {
  return (
    <>
      <GaleriaFotos
        secao={SECAO_FUNDO_ABERTURA}
        titulo="Foto de fundo da tela de carregamento"
        descricao="Envie a foto normal: o site aplica o desfoque automaticamente. Só uma foto é usada; sem foto, aparece o fundo atual (sala do café)."
        maximo={1}
        altPadrao="Fundo da tela de abertura"
        maxLado={480}
        previaDesfocada
      />
      <GaleriaFotos
        secao="cafe"
        titulo="Fotos do café da manhã"
        descricao="Aparecem na página “Café da manhã”. A primeira foto também aparece na home, ao lado de “Café da manhã”. Sem fotos, esses espaços ficam ocultos."
      />
      <GaleriaFotos
        secao="lazer"
        titulo="Fotos do lazer (piscina, deck e bar)"
        descricao="Aparecem na página “Lazer”. Enquanto nenhuma foto for enviada, a página mostra a foto da piscina."
      />
      <GaleriaFotos
        secao="contato"
        titulo="Foto da página de contato"
        descricao="Só a primeira foto é usada, no cartão de endereço da página “Contato”. Sem foto, aparece a fachada do hotel."
      />
    </>
  );
}
