import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getViewer, canAccessMarket, isUuid } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTabloidHtml } from "@/lib/renderTabloid";
import { formatBR } from "@/lib/dates";

export const runtime = "nodejs";

function formatValidity(from: string | null, until: string | null): string {
  if (from && until) return `Ofertas válidas de ${formatBR(from)} a ${formatBR(until)}`;
  if (from) return `Ofertas a partir de ${formatBR(from)}`;
  if (until) return `Ofertas válidas até ${formatBR(until)}`;
  return "";
}

// Monta o HTML final do tabloide (template + produtos). Quando dá certo, o
// tabloide sai de "rascunho" e vira "pronto".
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Tabloide não encontrado." }, { status: 404 });

  const who = await getViewer();
  if (who.status !== "ok") return NextResponse.json({ error: "Sua sessão expirou. Entre de novo." }, { status: 401 });

  const admin = createAdminClient();
  const { data: tabloid } = await admin
    .from("tabloids")
    .select("id, name, market_id, theme_id, status, valid_from, valid_until")
    .eq("id", id)
    .maybeSingle();
  if (!tabloid || !canAccessMarket(who.viewer, tabloid.market_id)) {
    return NextResponse.json({ error: "Tabloide não encontrado." }, { status: 404 });
  }
  if (!tabloid.theme_id) return NextResponse.json({ error: "Esse tabloide ainda não tem um tema." }, { status: 400 });

  const [{ data: market }, { data: theme }, { data: tabloidProducts }] = await Promise.all([
    admin.from("markets").select("name, logo_url, color_primary, color_secondary").eq("id", tabloid.market_id).single(),
    admin.from("themes").select("template_path, market_id").eq("id", tabloid.theme_id).maybeSingle(),
    admin
      .from("tabloid_products")
      .select("position, products(name, price, unit, image_url, category, market_id)")
      .eq("tabloid_id", id)
      .order("position", { ascending: true }),
  ]);
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });
  if (!theme || (theme.market_id !== null && theme.market_id !== tabloid.market_id)) {
    return NextResponse.json({ error: "Tema não encontrado." }, { status: 404 });
  }

  const products = (tabloidProducts ?? [])
    .map((tp) => (Array.isArray(tp.products) ? tp.products[0] : tp.products))
    .filter((p): p is NonNullable<typeof p> => !!p && p.market_id === tabloid.market_id)
    .map((p) => ({ name: p.name, price: p.price, unit: p.unit, imageUrl: p.image_url, category: p.category }));

  // o nome do arquivo vem do banco, mas não sai da pasta de templates
  const templateName = path.basename(theme.template_path);
  let templateHtml: string;
  try {
    templateHtml = await readFile(path.join(process.cwd(), "lib", "tabloidTemplates", templateName), "utf-8");
  } catch (err) {
    console.error("[render] template", err);
    return NextResponse.json({ error: "Não consegui carregar o modelo desse tema." }, { status: 500 });
  }

  const html = renderTabloidHtml(
    templateHtml,
    {
      name: market.name,
      logoUrl: market.logo_url,
      colorPrimary: market.color_primary,
      colorSecondary: market.color_secondary,
      tabloidName: tabloid.name,
      validityLabel: formatValidity(tabloid.valid_from, tabloid.valid_until),
    },
    products
  );

  if (tabloid.status === "rascunho") {
    const { error } = await admin.from("tabloids").update({ status: "pronto" }).eq("id", id);
    if (error) console.error("[render] status", error);
  }

  return NextResponse.json({ html });
}
