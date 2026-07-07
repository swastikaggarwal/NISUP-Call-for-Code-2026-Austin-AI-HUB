import sharp from "sharp";

// Perceptual image hashing (average-hash / aHash) for near-duplicate detection.
// Two photos of the SAME image (resized, re-saved, lightly edited) produce hashes
// with a small Hamming distance — so we can tell "this is the same picture" even
// if it isn't byte-identical. Server-side only (uses sharp).
//
// NOTE: this recognises the same PHOTO, not the same PERSON across different
// photos. // TODO: add face embeddings (e.g. face-api.js) for same-person match.

// Returns a 16-char hex hash (64 bits), or null if the image can't be decoded.
export async function perceptualHash(dataUrl: string): Promise<string | null> {
  try {
    const m = /^data:[^;]+;base64,(.+)$/.exec(dataUrl);
    if (!m) return null;
    const buf = Buffer.from(m[1], "base64");
    // 8x8 greyscale → 64 samples.
    const px = await sharp(buf)
      .greyscale()
      .resize(8, 8, { fit: "fill" })
      .raw()
      .toBuffer();
    if (px.length < 64) return null;
    let sum = 0;
    for (let i = 0; i < 64; i++) sum += px[i];
    const avg = sum / 64;
    let bits = "";
    for (let i = 0; i < 64; i++) bits += px[i] >= avg ? "1" : "0";
    let hex = "";
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch {
    return null;
  }
}

// Hamming distance between two hex hashes (number of differing bits).
export function hammingHex(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 999;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

// Compute pHashes for all image attachments on a case-like object.
export async function imagePHashes(
  attachments?: { kind: string; ref: string }[]
): Promise<string[]> {
  if (!attachments?.length) return [];
  const out: string[] = [];
  for (const a of attachments) {
    if (a.kind !== "image") continue;
    const h = await perceptualHash(a.ref);
    if (h) out.push(h);
  }
  return out;
}
