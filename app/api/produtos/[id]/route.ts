import { NextResponse } from "next/server";
import { readJson, serverError } from "@/lib/auth";
import { loadOwnedProduct } from "@/lib/server/product-access";

import { normalizeUnit, parseBRNumber } from "@/lib/products";
import type { TablesUpdate } from "@/lib/supabase/database.types";

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

// PATCH /api/produtos/{id}: ajustes rápidos feitos na lista de produtos.
export async function PATCH(req: Request, { params }: RouteContext<"/api/produtos/[id]">) {
  const { id } = await params;
  const g = await loadOwnedProduct(id);
  if ("error" in g) return g.error;
  const body = await readJson(req);

  const update: TablesUpdate<"products"> = {};
  if ("name" in body) {
    const name = text(body.name, 200);
    if (!name) return NextResponse.json({ error: "O produto precisa de um nome." }, { status: 400 });
    update.name = name;
  }
  if ("brand" in body) update.brand = text(body.brand, 80);
  if ("category" in body) update.category = text(body.category, 80);
  if ("unit" in body) update.unit = body.unit ? normalizeUnit(body.unit) : null;
  for (const key of ["price", "cost"] as const) {
    if (key in body) {
      const n = body[key] === null || body[key] === "" ? null : parseBRNumber(body[key]);
      if (n != null && (n < 0 || n >= 1e7)) return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
      update[key] = n == null ? null : Math.round(n * 100) / 100;
    }
  }
  if ("active" in body) update.active = body.active === true;
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

  const { data, error } = await g.admin
    .from("products")
    .update(update)
    .eq("id", id)
    .select("id, name, brand, category, unit, price, cost, active")
    .single();
  if (error) return serverError("produtos/editar", error, "Não consegui salvar. Tente de novo.");
  return NextResponse.json({ product: data });
}
