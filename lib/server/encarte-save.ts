import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { EncarteItemInput } from "./encarte-input";

type Admin = SupabaseClient<Database>;

// Grava (substituindo) os itens de um encarte, depois de conferir que todos
// os produtos são do mesmo mercado do encarte.
export async function saveItems(
  admin: Admin,
  marketId: string,
  tabloidId: string,
  items: EncarteItemInput[]
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const ids = items.map((i) => i.productId);
  const { data: owned, error: ownedError } = await admin.from("products").select("id").eq("market_id", marketId).in("id", ids);
  if (ownedError) {
    console.error("[encarte] conferir produtos", ownedError);
    return { ok: false, status: 500, error: "Não consegui conferir os produtos. Tente de novo." };
  }
  if ((owned ?? []).length !== ids.length) {
    return { ok: false, status: 400, error: "Alguns produtos escolhidos não são deste mercado." };
  }

  const { error: delError } = await admin.from("tabloid_products").delete().eq("tabloid_id", tabloidId);
  if (delError) {
    console.error("[encarte] limpar itens", delError);
    return { ok: false, status: 500, error: "Não consegui salvar os produtos do encarte." };
  }

  const { error } = await admin.from("tabloid_products").insert(
    items.map((it, i) => ({
      tabloid_id: tabloidId,
      product_id: it.productId,
      position: i,
      promo_price: it.promoPrice,
      old_price: it.oldPrice,
      highlight: it.highlight,
      limit_qty: it.limitQty,
      label: it.label,
    }))
  );
  if (error) {
    console.error("[encarte] gravar itens", error);
    return { ok: false, status: 500, error: "Não consegui salvar os produtos do encarte." };
  }
  return { ok: true };
}
