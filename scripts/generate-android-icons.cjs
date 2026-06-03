/**
 * 從 assets/icon-1024.png 產生：
 * - Android mipmap / drawable-nodpi
 * - Web PWA（public PNG + manifest.webmanifest）
 * 設計意圖：單一母檔，避免 Android 與「加到主畫面」圖示分叉。
 * 使用方式: npm run icons
 */
const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SOURCE = path.join(ROOT, 'assets', 'icon-1024.png');

const APP_NAME = 'Ultimate Physique';
const APP_SHORT_NAME = 'UP';
const THEME_COLOR = '#0A0A0A';

// Adaptive Icon foreground 層為 108dp，對應像素
const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const LAUNCHER_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

/** Web / PWA / apple-touch-icon */
const WEB_ICONS = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function loadMasterBuffer() {
  if (!fs.existsSync(SOURCE)) {
    console.error('找不到來源圖檔: ' + SOURCE);
    process.exit(1);
  }

  const meta = await sharp(SOURCE).metadata();
  if (meta.width !== meta.height) {
    console.error(`來源圖必須為正方形，目前為 ${meta.width}x${meta.height}`);
    process.exit(1);
  }

  return sharp(SOURCE)
    .resize(1024, 1024, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function generateAndroid(buffer) {
  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const outDir = path.join(ANDROID_RES, folder);
    await ensureDir(outDir);
    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'));
    console.log('寫入 ' + folder + '/ic_launcher_foreground.png (' + size + 'px)');
  }

  for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
    const outDir = path.join(ANDROID_RES, folder);
    await ensureDir(outDir);
    const p = path.join(outDir, 'ic_launcher.png');
    const r = path.join(outDir, 'ic_launcher_round.png');
    await sharp(buffer).resize(size, size).png().toFile(p);
    await sharp(buffer).resize(size, size).png().toFile(r);
    console.log('寫入 ' + folder + '/ic_launcher.png, ic_launcher_round.png (' + size + 'px)');
  }

  const drawableNodpi = path.join(ANDROID_RES, 'drawable-nodpi');
  await ensureDir(drawableNodpi);
  await sharp(buffer)
    .resize(432, 432)
    .png()
    .toFile(path.join(drawableNodpi, 'ic_launcher_foreground.png'));
  console.log('寫入 drawable-nodpi/ic_launcher_foreground.png (432px)');
}

async function generateWeb(buffer) {
  await ensureDir(PUBLIC_DIR);

  for (const { file, size } of WEB_ICONS) {
    const out = path.join(PUBLIC_DIR, file);
    await sharp(buffer).resize(size, size).png().toFile(out);
    console.log('寫入 public/' + file + ' (' + size + 'px)');
  }

  const manifest = {
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_NAME,
    start_url: '/',
    display: 'standalone',
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('寫入 public/manifest.webmanifest');
}

async function generate() {
  const buffer = await loadMasterBuffer();
  await generateAndroid(buffer);
  await generateWeb(buffer);
  console.log('圖標產生完成（Android + Web）。');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
