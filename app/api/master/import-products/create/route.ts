import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedProduct } from "@/lib/products";

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "master" && profile.role !== "mercado")) return null;
  return user;
}

// Grava a lista de produtos já revisada pelo dono do mercado (a etapa de
// parse só devolve pra revisão, nada é gravado até essa confirmação). Faz
// upsert por (market_id, sku): reenviar a planilha depois pra atualizar
// preço/estoque não duplica produto.
export async function POST(req: NextRequest) {
  const user = await requireTeamMember();
  if (!user) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const marketId = String(body?.marketId || "").trim();
  const products = Array.isArray(body?.products) ? (body.products as ParsedProduct[]) : null;

  if (!marketId) return NextResponse.json({ error: "Informe o mercado." }, { status: 400 });
  if (!products || products.length === 0) {
    return NextResponse.json({ error: "Nenhum produto pra importar." }, { status: 400 });
  }

  const admin = createAdminClient();

  const rows = products
    .filter((p) => p.name && p.name.trim())
    .map((p) => ({
      market_id: marketId,
      sku: p.sku,
      name: p.name.trim(),
      brand: p.brand || null,
      category: p.category || null,
      price: p.price,
      stock: p.stock,
      image_status: "pendente" as const,
    }));

  const { error, count } = await admin
    .from("products")
    .upsert(rows, { onConflict: "market_id,sku", count: "exact" });

  if (error) {
    return NextResponse.json({ error: `Erro ao gravar produtos: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ imported: count ?? rows.length });
}
