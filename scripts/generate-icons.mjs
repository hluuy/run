import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#ef4444"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:0.2"/>
      <stop offset="100%" style="stop-color:#f97316;stop-opacity:0"/>
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="lineblur">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="#0f1124"/>

  <!-- Glow blob behind line -->
  <ellipse cx="256" cy="256" rx="200" ry="80" fill="#f97316" opacity="0.07" filter="url(#blur)"/>

  <!-- ECG fill area (glow under line) -->
  <polygon
    points="52,290 52,256 120,256 148,200 176,310 196,180 220,180 244,256 268,110 292,400 308,256 332,256 360,256"
    fill="url(#glow)" opacity="0.6"/>

  <!-- Glow copy of line (blur) -->
  <polyline
    points="52,256 120,256 148,200 176,310 196,180 220,180 244,256 268,110 292,400 308,256 332,256 360,256 460,256"
    fill="none" stroke="#f97316" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"
    opacity="0.35" filter="url(#lineblur)"/>

  <!-- ECG line -->
  <polyline
    points="52,256 120,256 148,200 176,310 196,180 220,180 244,256 268,110 292,400 308,256 332,256 360,256 460,256"
    fill="none" stroke="url(#grad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Dot at peak -->
  <circle cx="268" cy="110" r="14" fill="#f97316"/>
  <circle cx="268" cy="110" r="22" fill="#f97316" opacity="0.25"/>
</svg>`

const svgBuffer = Buffer.from(svg)

async function generate() {
  const sizes = [192, 512]
  for (const size of sizes) {
    const out = join(__dirname, '..', 'public', 'icons', `icon-${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(out)
    console.log(`✓ icon-${size}.png`)
  }
}

generate().catch(console.error)
