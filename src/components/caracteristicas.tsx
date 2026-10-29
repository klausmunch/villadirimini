import {
  Accessibility,
  AirVent,
  Armchair,
  Baby,
  Bath,
  BedDouble,
  BedSingle,
  Car,
  Check,
  Coffee,
  Eye,
  Fan,
  Lock,
  Microwave,
  PawPrint,
  Phone,
  Refrigerator,
  ShowerHead,
  Shirt,
  Sun,
  Tv,
  Utensils,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/** Sem acentos e em minúsculas, para reconhecer "Ar-condicionado", "ar condicionado"... */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Ordem importa: o primeiro termo encontrado define o ícone.
const ICONES: [RegExp, LucideIcon][] = [
  [/wi-?fi|internet/, Wifi],
  [/ar[ -]?condicionado|climatiza|split/, AirVent],
  [/ventilador/, Fan],
  [/\btv\b|televis|cabo|smart/, Tv],
  [/frigobar|geladeira|refrigerador/, Refrigerator],
  [/micro-?ondas/, Microwave],
  [/chuveiro|ducha/, ShowerHead],
  [/banh|banheira|hidro/, Bath],
  [/casal|queen|king/, BedDouble],
  [/solteiro|cama/, BedSingle],
  [/berco|bebe|crianca/, Baby],
  [/cafe/, Coffee],
  [/cozinha|utensil|cooktop|fogao/, Utensils],
  [/vista|mar\b|janela/, Eye],
  [/varanda|sacada|sol\b/, Sun],
  [/piscina|praia/, Waves],
  [/cofre|seguranca|fechadura/, Lock],
  [/toalha|enxoval|roupa de cama|secador/, Shirt],
  [/telefone/, Phone],
  [/estaciona|garagem|vaga/, Car],
  [/pet|animal|cachorro/, PawPrint],
  [/acessivel|acessibilidade|cadeirante/, Accessibility],
  [/sofa|poltrona|estar/, Armchair],
];

export function iconeDaCaracteristica(texto: string): LucideIcon {
  const t = normalizar(texto);
  return ICONES.find(([padrao]) => padrao.test(t))?.[1] ?? Check;
}

/** Características do quarto como etiquetas com ícone. */
export function ListaCaracteristicas({ itens }: { itens: string[] }) {
  if (!itens.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Características do quarto">
      {itens.map((item) => {
        const Icone = iconeDaCaracteristica(item);
        return (
          <li
            key={item}
            className="inline-flex items-center gap-1.5 bg-paper px-2 py-1 text-xs text-ink-2 outline-1 -outline-offset-1 outline-black/5"
          >
            <Icone className="h-3.5 w-3.5 shrink-0 text-surf" aria-hidden="true" />
            {item}
          </li>
        );
      })}
    </ul>
  );
}
