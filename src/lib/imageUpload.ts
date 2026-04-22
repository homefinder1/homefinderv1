import { supabase } from "@/integrations/supabase/client";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const BUCKET = "annons-bilder";

/**
 * Komprimerar en bild i webbläsaren till JPEG och returnerar en Blob.
 * Max-storlek: 1600px (längsta sidan), kvalitet 82%.
 */
export async function komprimeraBild(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Filen är inte en bild");
  }

  const bitmap = await createImageBitmap(file).catch(async () => {
    // Fallback för äldre webbläsare
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Kunde inte läsa bilden"));
        img.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  const w = (bitmap as ImageBitmap).width || (bitmap as HTMLImageElement).naturalWidth;
  const h = (bitmap as ImageBitmap).height || (bitmap as HTMLImageElement).naturalHeight;

  const skala = Math.min(1, MAX_DIMENSION / Math.max(w, h));
  const nyW = Math.round(w * skala);
  const nyH = Math.round(h * skala);

  const canvas = document.createElement("canvas");
  canvas.width = nyW;
  canvas.height = nyH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas stöds inte");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, nyW, nyH);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Kunde inte komprimera bilden"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Laddar upp en komprimerad bild till annons-bilder-bucketen och returnerar publik URL.
 * Filen läggs i userId/-mappen för att RLS-policyn ska godkänna.
 */
export async function laddaUppBild(file: File, userId: string): Promise<string> {
  const blob = await komprimeraBild(file);
  const id = crypto.randomUUID();
  const path = `${userId}/${id}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
