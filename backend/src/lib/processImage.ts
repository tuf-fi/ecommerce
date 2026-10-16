import sharp from "sharp";

const MAX_SIDE = 1600;

// Re-encodes to WEBP: drops EXIF (phone screenshots can carry location), fixes rotation and caps the size.
export async function normalizeScreenshot(input: Buffer): Promise<{ data: Buffer; mimeType: "image/webp" }> {
  const data = await sharp(input, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  return { data, mimeType: "image/webp" };
}
