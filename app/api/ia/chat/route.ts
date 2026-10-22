import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { anthropic, GERENTE_MODEL } from "@/lib/ai/models";
import { extractText } from "@/lib/ai/gerente";
import { especialistaValido, respostaDoTexto, systemDoChat, type ChatMsg } from "@/lib/ai/chat";
import { montarContexto } from "@/lib/ai/chat-contexto";
import { recordUsage, remainingToday } from "@/lib/ai/usage";

export const maxDuration = 60;

const MAX_MSGS = 12;
const MAX_CHARS = 1500;

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  const esp = especialistaValido(body.especialista) ? body.especialista : "geral";

  const msgs: ChatMsg[] = (Array.isArray(body.messages) ? body.messages : [])
    .map((m: unknown) => {
      const o = (m ?? {}) as Record<string, unknown>;
      return { role: o.role === "assistant" ? "assistant" : "user", content: typeof o.content === "string" ? o.content.slice(0, MAX_CHARS) : "" } as ChatMsg;
    })
    .filter((m: ChatMsg) => m.content.trim())
    .slice(-MAX_MSGS);
  // a conversa precisa começar e terminar com o usuário
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return NextResponse.json({ error: "Escreva uma pergunta." }, { status: 400 });

  const client = anthropic();
  if (!client) return NextResponse.json({ error: "O gerente ainda não está configurado. Avise o time Promia." }, { status: 503 });
  if ((await remainingToday(marketId, "chat")) <= 0) {
    return NextResponse.json({ error: "Você conversou bastante hoje. O gerente volta a responder amanhã." }, { status: 429 });
  }

  const ctx = await montarContexto(createAdminClient(), marketId, esp);
  if (!ctx) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  try {
    const res = await client.messages.create({
      model: GERENTE_MODEL,
      max_tokens: 1200,
      system: `${systemDoChat(esp, ctx.nome)}\n\n<dados>\n${ctx.dados}\n</dados>`,
      messages: msgs.map((m) => ({ role: m.role, content: m.content })),
    });
    await recordUsage(marketId, access.viewer.userId, "chat", 1);
    const out = respostaDoTexto(extractText(res.content), ctx.slug);
    if (!out) return NextResponse.json({ error: "Não consegui responder agora. Tente reformular." }, { status: 502 });
    return NextResponse.json(out);
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: "O gerente não respondeu agora. Tente de novo em instantes." }, { status: 502 });
  }
}
