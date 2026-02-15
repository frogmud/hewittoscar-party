/**
 * Scans HEWITTOSCARPARTY year folders and generates a JSON manifest
 * of all photos organized by year. Output: src/data/photo-manifest.json
 *
 * Run: node scripts/generate-manifest.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_ROOT = path.resolve(__dirname, '../../_big_reference/HEWITTOSCARPARTY');
const OUTPUT = path.resolve(__dirname, '../src/data/photo-manifest.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif']);
const YEARS = Array.from({ length: 16 }, (_, i) => String(1999 + i));

function collectPhotos(dir, basePath = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...collectPhotos(fullPath, relPath));
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      results.push(relPath);
    }
  }
  return results;
}

const manifest = {};

for (const year of YEARS) {
  const yearDir = path.join(PHOTOS_ROOT, year);
  if (!fs.existsSync(yearDir)) continue;

  const photos = collectPhotos(yearDir);
  if (photos.length > 0) {
    manifest[year] = photos.sort();
  }
}

// Ensure output directory exists
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));

const totalPhotos = Object.values(manifest).reduce((sum, arr) => sum + arr.length, 0);
console.log(`Generated manifest: ${Object.keys(manifest).length} years, ${totalPhotos} photos`);
console.log(`Written to: ${OUTPUT}`);
