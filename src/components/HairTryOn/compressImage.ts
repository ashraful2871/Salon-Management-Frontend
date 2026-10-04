const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MIN_SHORT_SIDE = 400;
const MAX_LONG_SIDE = 1600;

export type CompressResult =
  | { ok: true; blob: Blob }
  | { ok: false; message: string };

/**
 * Turns the chosen photo into an upright JPEG no longer than 1600 px. Drawing
 * it to a canvas drops the EXIF block, GPS included.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Please choose a JPG or PNG photo." };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, message: "That photo is over 15 MB. Please choose a smaller one." };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, message: "Please choose a JPG or PNG photo." };
  }

  try {
    const { width, height } = bitmap;
    if (Math.min(width, height) < MIN_SHORT_SIDE) {
      return {
        ok: false,
        message: "That photo is too small. Please use one at least 400 px on its short side.",
      };
    }

    const scale = Math.min(1, MAX_LONG_SIDE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, message: "Your browser couldn't prepare this photo." };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob
      ? { ok: true, blob }
      : { ok: false, message: "Your browser couldn't prepare this photo." };
  } finally {
    bitmap.close();
  }
}
