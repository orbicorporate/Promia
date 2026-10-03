"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Link2, RotateCw, ImageOff, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, cn } from "@/components/ui";

export type PhotoProduct = {
  id: string;
  name: string;
  image_url: string | null;
  image_status: string | null;
  image_candidates: string[] | null;
};

const proxied = (u: string) => `/api/imagem?u=${encodeURIComponent(u)}`;

async function postFoto(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/produtos/${id}/foto`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Não consegui salvar a foto.");
  return data as { imageUrl?: string };
}

// Reduz e converte no próprio aparelho: foto de celular de 12 MP vira um
// JPEG leve, e formatos que o servidor não lê (HEIC no iPhone) passam a
// funcionar quando o navegador sabe abrir.
async function toJpeg(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function PhotoEditor({
  product,
  onChange,
  compact,
}: {
  product: PhotoProduct;
  onChange: (patch: Partial<PhotoProduct>) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const candidates = (product.image_candidates ?? []).filter((c) => c !== product.image_url).slice(0, 6);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const applyUrl = (u: string, key: string) =>
    run(key, async () => {
      const r = await postFoto(product.id, { acao: "url", url: u });
      onChange({ image_url: r.imageUrl ?? null, image_status: "encontrada", image_candidates: null });
      setUrl("");
      setShowUrl(false);
      toast.success("Foto salva.");
    });

  const upload = (file: File) =>
    run("upload", async () => {
      const jpg = await toJpeg(file);
      const prep = (await postFoto(product.id, { acao: "envio", fileName: jpg.type === "image/jpeg" ? "foto.jpg" : file.name })) as unknown as {
        path: string;
        token: string;
      };
      const { error } = await createClient().storage.from("midia").uploadToSignedUrl(prep.path, prep.token, jpg, { contentType: jpg.type });
      if (error) throw new Error("Não consegui enviar a foto. Tente de novo.");
      const r = await postFoto(product.id, { acao: "confirmar", path: prep.path });
      onChange({ image_url: r.imageUrl ?? null, image_status: "encontrada", image_candidates: null });
      toast.success("Foto enviada.");
    });

  return (
    <div className="space-y-3">
      <div className={cn("flex gap-3", compact ? "items-center" : "items-start")}>
        <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--line)]", compact ? "size-20" : "size-28")}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
          ) : (
            <ImageOff className="size-7 text-[#9aa8a0]" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="vidro" icon={<Camera className="size-4" />} loading={busy === "upload"} onClick={() => fileRef.current?.click()}>
            Tirar ou enviar foto
          </Button>
          <Button size="sm" variant="vidro" icon={<Link2 className="size-4" />} onClick={() => setShowUrl((v) => !v)}>
            Colar link
          </Button>
          <Button
            size="sm"
            variant="fantasma"
            icon={<RotateCw className="size-4" />}
            loading={busy === "buscar"}
            onClick={() =>
              run("buscar", async () => {
                await postFoto(product.id, { acao: "buscar" });
                onChange({ image_status: "pendente", image_candidates: null });
                toast.success("Na fila de busca. Toque em Buscar fotos para rodar.");
              })
            }
          >
            Buscar de novo
          </Button>
          {product.image_status !== "nao_encontrada" && (
            <Button
              size="sm"
              variant="fantasma"
              icon={<ImageOff className="size-4" />}
              loading={busy === "sem"}
              onClick={() =>
                run("sem", async () => {
                  await postFoto(product.id, { acao: "sem-foto" });
                  onChange({ image_status: "nao_encontrada", image_url: null, image_candidates: null });
                })
              }
            >
              Sem foto
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
      {showUrl && (
        <motion.form
          initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) applyUrl(url.trim(), "url");
          }}
        >
          <Input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://... endereço da imagem" inputMode="url" />
          <Button type="submit" loading={busy === "url"}>
            Usar
          </Button>
        </motion.form>
      )}
      </AnimatePresence>

      {candidates.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-[var(--ink-2)]">Encontrei estas. Toque na certa:</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {candidates.map((c, i) => (
              <button
                key={c}
                type="button"
                disabled={!!busy}
                onClick={() => applyUrl(c, `c${i}`)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-white ring-1 ring-[var(--line)] transition hover:ring-2 hover:ring-[var(--folha)] disabled:opacity-60"
              >
                <img
                  src={proxied(c)}
                  alt={`Opção ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-contain p-1"
                  onError={(e) => ((e.currentTarget.closest("button") as HTMLElement).style.display = "none")}
                />
                <span className="absolute inset-0 grid place-items-center bg-[var(--folha)]/0 text-white opacity-0 transition group-hover:bg-[var(--folha)]/25 group-hover:opacity-100">
                  {busy === `c${i}` ? <RotateCw className="size-6 animate-spin" /> : <Check className="size-7 drop-shadow" strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
