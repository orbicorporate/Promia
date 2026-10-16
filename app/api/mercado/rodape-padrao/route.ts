import { NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apagarRodapePadrao, gravarRodapePadrao } from "@/lib/server/rodape-padrao";

// PUT { marketId, rodape }  guarda o rodapé como padrão do mercado
// DELETE { marketId }       volta ao rodapé original do sistema
export async function PUT(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const ok = await gravarRodapePadrao(createAdminClient(), body.marketId as string, body.rodape);
  if (!ok) return NextResponse.json({ error: "Não consegui salvar o rodapé padrão." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const ok = await apagarRodapePadrao(createAdminClient(), body.marketId as string);
  if (!ok) return NextResponse.json({ error: "Não consegui apagar o rodapé padrão." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
