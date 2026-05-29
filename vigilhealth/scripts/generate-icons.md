# PWA Icon Generation Guide

The `manifest.json` references PNG icons at `public/icons/` in the following sizes:
`72`, `96`, `128`, `144`, `152`, `192`, `384`, `512`

## Option 1 — PWA Builder (recommended, no install required)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload a high-resolution source image (at least 512×512 px, ideally SVG or 1024×1024 PNG)
3. Download the generated ZIP
4. Extract and copy the PNG files into `vigilhealth/public/icons/`
5. Rename files to match the manifest paths: `icon-<size>x<size>.png`

## Option 2 — RealFaviconGenerator

1. Go to https://realfavicongenerator.net
2. Upload your source image
3. Configure maskable icon safe zone (keep important content within the inner 80% of the canvas)
4. Download the package and copy PNGs to `vigilhealth/public/icons/`

## Option 3 — `sharp` (Node.js, local generation)

Install `sharp` as a dev dependency:

```bash
npm install --save-dev sharp
```

Create `scripts/generate-icons.js`:

```js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.resolve(__dirname, '../public/icons/source.png'); // your 1024x1024 source
const DEST = path.resolve(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

fs.mkdirSync(DEST, { recursive: true });

for (const size of SIZES) {
  sharp(SOURCE)
    .resize(size, size)
    .toFile(path.join(DEST, `icon-${size}x${size}.png`))
    .then(() => console.log(`Generated icon-${size}x${size}.png`))
    .catch(console.error);
}
```

Run:

```bash
node scripts/generate-icons.js
```

## Maskable Icon Guidelines

For icons with `"purpose": "maskable any"`, ensure the logo/artwork sits within the
**safe zone** — the central 80% of the canvas (i.e., leave at least 10% padding on each side).
Browsers may crop the outer 20% when displaying maskable icons.

## Required Files After Generation

Place all files in `vigilhealth/public/icons/`:

```
public/
  icons/
    icon-72x72.png
    icon-96x96.png
    icon-128x128.png
    icon-144x144.png
    icon-152x152.png
    icon-192x192.png
    icon-384x384.png
    icon-512x512.png
```
