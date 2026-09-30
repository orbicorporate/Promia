import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTabloidHtml } from "@/lib/renderTabloid";

export const runtime = "nodejs";

function formatValidity(from: string | null, until: string | null): string {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  if (from && until) return `Válido de ${fmt(from)} a ${fmt(until)}`;
  if (from) return `A partir de ${fmt(from)}`;
  return "";
}

// Monta o HTML final do tabloide (template + produtos selecionados), pra
// ser inserido no navegador (dangerouslySetInnerHTML) e capturado em
// imagem com html2canvas-pro do lado do cliente.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sem permissão." }, { status: 401 });

  const admin = createAdminClient();

  const { data: tabloid } = await admin
    .from("tabloids")
    .select("id, name, market_id, theme_id, valid_from, valid_until")
    .eq("id", id)
    .single();
  if (!tabloid) return NextResponse.json({ error: "Tabloide não encontrado." }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role, market_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  if (profile.role === "mercado" && profile.market_id !== tabloid.market_id) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  }

  const { data: market } = await admin
    .from("markets")
    .select("name, logo_url, color_primary, color_secondary")
    .eq("id", tabloid.market_id)
    .single();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  if (!tabloid.theme_id) {
    return NextResponse.json({ error: "Esse tabloide ainda não tem um tema escolhido." }, { status: 400 });
  }

  const { data: theme } = await admin.from("themes").select("template_path").eq("id", tabloid.theme_id).single();
  if (!theme) return NextResponse.json({ error: "Tema não encontrado." }, { status: 404 });

  const { data: tabloidProducts } = await admin
    .from("tabloid_products")
    .select("position, products(name, price, image_url, category)")
    .eq("tabloid_id", id)
    .order("position", { ascending: true });

  const products = (tabloidProducts || [])
    .map((tp) => {
      const p = Array.isArray(tp.products) ? tp.products[0] : tp.products;
      if (!p) return null;
      return {
        name: p.name as string,
        price: p.price as number | null,
        imageUrl: p.image_url as string | null,
        category: p.category as string | null,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  let templateHtml: string;
  try {
    const templatePath = path.join(process.cwd(), "lib", "tabloidTemplates", theme.template_path);
    templateHtml = await readFile(templatePath, "utf-8");
  } catch {
    return NextResponse.json({ error: "Não consegui carregar o template desse tema." }, { status: 500 });
  }

  const html = renderTabloidHtml(
    templateHtml,
    {
      name: market.name,
      logoUrl: market.logo_url,
      colorPrimary: market.color_primary || "#16a34a",
      colorSecondary: market.color_secondary || "#111827",
      tabloidName: tabloid.name,
      validityLabel: formatValidity(tabloid.valid_from, tabloid.valid_until),
    },
    products
  );

  return NextResponse.json({ html });
}
