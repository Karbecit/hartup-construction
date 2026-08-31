import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imagesDir = path.join(root, 'public', 'images');
const maxEdge = 1920;
const jpegQuality = 78;
const minBytes = 250_000;

const textRoots = ['content', 'includes', 'src', 'admin', 'css'];
const textExts = new Set(['.json', '.php', '.js', '.astro', '.css', '.md', '.html']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function replaceInFiles(fromName, toName) {
  if (fromName === toName) return;
  for (const rootDir of textRoots) {
    for (const file of walk(path.join(root, rootDir))) {
      if (!textExts.has(path.extname(file).toLowerCase())) continue;
      const before = fs.readFileSync(file, 'utf8');
      if (!before.includes(fromName)) continue;
      fs.writeFileSync(file, before.split(fromName).join(toName));
    }
  }
}

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return null;

  const original = fs.readFileSync(file);
  if (original.length < minBytes) {
    const meta = await sharp(original, { failOn: 'none' }).metadata();
    if ((meta.width || 0) <= maxEdge && (meta.height || 0) <= maxEdge) {
      return null;
    }
  }

  const image = sharp(original, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  const pipeline = image.resize({
    width: maxEdge,
    height: maxEdge,
    fit: 'inside',
    withoutEnlargement: true,
  });

  const rel = path.relative(imagesDir, file);
  const opaquePng = ext === '.png' && !meta.hasAlpha;

  if (opaquePng) {
    const buffer = await pipeline.jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer();
    const dest = file.slice(0, -ext.length) + '.jpg';
    fs.writeFileSync(dest, buffer);
    if (dest !== file) fs.unlinkSync(file);
    const fromRel = rel.replace(/\\/g, '/');
    const toRel = path.relative(imagesDir, dest).replace(/\\/g, '/');
    replaceInFiles(fromRel, toRel);
    replaceInFiles(path.basename(file), path.basename(dest));
    return `${rel} → ${path.basename(dest)} (${(original.length / 1024 / 1024).toFixed(2)}MB → ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`;
  }

  const buffer =
    ext === '.png'
      ? await pipeline.png({ compressionLevel: 9, quality: 80 }).toBuffer()
      : ext === '.webp'
        ? await pipeline.webp({ quality: jpegQuality }).toBuffer()
        : await pipeline.jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer();

  if (buffer.length >= original.length && (meta.width || 0) <= maxEdge) {
    return null;
  }

  fs.writeFileSync(file, buffer);
  return `${rel} (${(original.length / 1024 / 1024).toFixed(2)}MB → ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`;
}

const files = walk(imagesDir);
const results = [];
for (const file of files) {
  try {
    const result = await optimizeFile(file);
    if (result) results.push(result);
  } catch (error) {
    console.error(`Skip ${path.relative(imagesDir, file)}: ${error.message}`);
  }
}

console.log(results.length ? results.join('\n') : 'No images needed optimizing.');
console.log(`\nOptimized ${results.length} file(s).`);
