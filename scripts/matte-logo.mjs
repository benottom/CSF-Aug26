// Removes the solid white canvas from the CSF logo PNG by computing real
// alpha transparency from how "white" each pixel is, instead of relying on
// CSS mix-blend-mode (which is unreliable on mobile Safari when an ancestor
// is position:sticky — that's why the white box came back on mobile).
import sharp from 'sharp';

const SRC = 'public/csf-logo-2026.png';
const OUT = 'public/csf-logo-2026-transparent.png';

// Alpha ramps to 0 as the pixel gets whiter, giving a smooth anti-aliased
// cutout instead of a hard jagged edge.
const OPAQUE_BELOW = 200; // min(r,g,b) at or below this stays fully opaque
const TRANSPARENT_ABOVE = 250; // min(r,g,b) at or above this is fully transparent

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const minC = Math.min(r, g, b);

  let alpha;
  if (minC <= OPAQUE_BELOW) {
    alpha = 255;
  } else if (minC >= TRANSPARENT_ABOVE) {
    alpha = 0;
  } else {
    const t = (minC - OPAQUE_BELOW) / (TRANSPARENT_ABOVE - OPAQUE_BELOW);
    alpha = Math.round(255 * (1 - t));
  }
  data[i + 3] = alpha;
}

await sharp(data, { raw: { width, height, channels } }).png().toFile(OUT);
console.log('wrote', OUT);
