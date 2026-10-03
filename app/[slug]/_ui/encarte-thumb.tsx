/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FORMATS } from "@/lib/encarte/formats";
import { validityLabel } from "@/lib/encarte/text";
import { isEncarteFormat } from "@/lib/encarte/types";
import { getTheme } from "@/lib/encarte/themes";
import { FORMAT_SHORT } from "@/lib/encarte/labels";

export function EncarteThumb({
  slug,
  encarte,
}: {
  slug: string;
  encarte: { id: string; name: string; format: string; theme_key: string; valid_from: string | null; valid_until: string | null; updated_at: string };
}) {
  const fmt = isEncarteFormat(encarte.format) ? encarte.format : "feed";
  const f = FORMATS[fmt];
  const theme = getTheme(encarte.theme_key);
  const validade = validityLabel(encarte.valid_from, encarte.valid_until);
  return (
    <Link href={`/${slug}/encartes/${encarte.id}`} className="group block">
      <div
        className="relative overflow-hidden rounded-[18px] ring-1 ring-[var(--line)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.5)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_26px_50px_-24px_rgba(0,0,0,0.55)]"
        style={{ aspectRatio: `${f.width} / ${f.height}`, background: theme.palette.bg }}
      >
        <img
          src={`/api/encartes/${encarte.id}/imagem?pagina=1&v=${encodeURIComponent(encarte.updated_at)}`}
          alt={`Primeira página do encarte ${encarte.name}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <p className="mt-2 truncate font-semibold">{encarte.name}</p>
      <p className="truncate text-sm text-[var(--ink-3)]">
        {FORMAT_SHORT[fmt]}
        {validade ? ` · ${validade.replace(/^Ofertas válidas /, "")}` : ""}
      </p>
    </Link>
  );
}
