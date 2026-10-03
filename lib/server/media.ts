import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchPublicImage } from "@/lib/net";

type Admin = SupabaseClient<Database>;

export const MEDIA_BUCKET = "midia";

// Toda foto usada no Promia é copiada para o nosso Storage: não some
// quando o site de origem cai, não tem problema de CORS e sai sempre em
// JPEG ou PNG (o desenho do encarte não lê WebP nem AVIF).

export async function normalizeImage(input: ArrayBuffer | Buffer, { maxSize = 1200, keepAlpha = false } = {}) {
  const img = sharp(Buffer.from(input as ArrayBuffer), { failOn: "none" }).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("imagem inválida");
  const resized = img.resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true });
  const hasAlpha = keepAlpha && meta.hasAlpha;
  const body = hasAlpha ? await resized.png({ compressionLevel: 9 }).toBuffer() : await resized.flatten({ background: "#ffffff" }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return { body, contentType: hasAlpha ? "image/png" : "image/jpeg", ext: hasAlpha ? "png" : "jpg", width: meta.width, height: meta.height };
}

export function publicUrl(admin: Admin, path: string) {
  return admin.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadImage(admin: Admin, path: string, body: Buffer, contentType: string) {
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, body, { contentType, upsert: true, cacheControl: "31536000" });
  if (error) throw error;
  return publicUrl(admin, path);
}

// Baixa (com proteção contra endereço interno), normaliza e guarda.
export async function storeImageFromUrl(admin: Admin, basePath: string, url: string): Promise<{ url: string; path: string } | null> {
  const fetched = await fetchPublicImage(url, { maxBytes: 8 * 1024 * 1024, timeoutMs: 10000 });
  if (!fetched) return null;
  try {
    const img = await normalizeImage(fetched.body);
    if (img.width < 80 || img.height < 80) return null; // ícone, não foto
    const path = `${basePath}-${Date.now().toString(36)}.${img.ext}`;
    return { url: await uploadImage(admin, path, img.body, img.contentType), path };
  } catch (err) {
    console.error("[media] guardar", err);
    return null;
  }
}

// Arquivo que o navegador subiu por URL assinada: normaliza no lugar.
export async function normalizeUploaded(admin: Admin, path: string, opts: { keepAlpha?: boolean; maxSize?: number } = {}) {
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).download(path);
  if (error || !data) throw error ?? new Error("arquivo não encontrado");
  const img = await normalizeImage(await data.arrayBuffer(), opts);
  const finalPath = path.replace(/\.[a-z0-9]+$/i, "") + `.${img.ext}`;
  const url = await uploadImage(admin, finalPath, img.body, img.contentType);
  if (finalPath !== path) await admin.storage.from(MEDIA_BUCKET).remove([path]);
  return { url, path: finalPath };
}

export const UPLOAD_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;
