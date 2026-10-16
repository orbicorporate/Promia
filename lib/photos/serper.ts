// Busca de imagens do Google pela API do Serper (serper.dev). Devolve as
// URLs dos arquivos de imagem e das miniaturas, já no Brasil e em
// português. Só é usada quando SERPER_API_KEY existe.

export type ImageHit = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  domain: string | null;
};

export function serperEnabled() {
  return !!process.env.SERPER_API_KEY?.trim();
}

const NOISE = /(pinterest|facebook|instagram|tiktok|youtube|shutterstock|istockphoto|gettyimages|dreamstime|freepik|alamy|123rf|depositphotos|vectorstock)\./i;

export async function searchImages(q: string, { num = 10, timeoutMs = 6000 } = {}): Promise<ImageHit[] | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-KEY": key, "content-type": "application/json" },
      body: JSON.stringify({ q, gl: "br", hl: "pt-br", num }),
    });
    if (!res.ok) {
      console.error("[serper]", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as {
      images?: { title?: string; imageUrl?: string; thumbnailUrl?: string; imageWidth?: number; imageHeight?: number; domain?: string }[];
    };
    return (json.images ?? [])
      .filter((i) => i.imageUrl?.startsWith("https://") && !NOISE.test(i.domain ?? "") && !NOISE.test(i.imageUrl ?? ""))
      .filter((i) => !i.imageUrl!.toLowerCase().endsWith(".svg"))
      .map((i) => ({
        title: i.title ?? "",
        imageUrl: i.imageUrl!,
        thumbnailUrl: i.thumbnailUrl?.startsWith("https://") ? i.thumbnailUrl : null,
        width: i.imageWidth ?? null,
        height: i.imageHeight ?? null,
        domain: i.domain ?? null,
      }));
  } catch (err) {
    console.error("[serper] falhou", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Google Shopping pela mesma chave do Serper: devolve a foto de catálogo do
// produto (embalagem de frente, fundo limpo), a melhor fonte para item de marca.
export async function searchShopping(q: string, { timeoutMs = 6000 } = {}): Promise<ImageHit[] | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-KEY": key, "content-type": "application/json" },
      body: JSON.stringify({ q, gl: "br", hl: "pt-br", num: 10 }),
    });
    if (!res.ok) {
      console.error("[serper/shopping]", res.status);
      return null;
    }
    const json = (await res.json()) as { shopping?: { title?: string; imageUrl?: string; source?: string }[] };
    return (json.shopping ?? [])
      .filter((i) => i.imageUrl?.startsWith("https://") && !NOISE.test(i.imageUrl ?? ""))
      .map((i) => ({ title: i.title ?? "", imageUrl: i.imageUrl!, thumbnailUrl: null, width: null, height: null, domain: i.source ?? null }));
  } catch (err) {
    console.error("[serper/shopping] falhou", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
