const { build } = require('vite');
const fs = require('fs');
const path = require('path');

async function run() {
  const root = path.resolve(__dirname, '..');
  const dist = path.resolve(root, 'dist');

  console.log('Starting Drive Pins extension build...');

  // Ensure clean dist directory
  if (fs.existsSync(dist)) {
    fs.rmSync(dist, { recursive: true, force: true });
  }
  fs.mkdirSync(dist, { recursive: true });

  // 1. Build Content Script as IIFE
  console.log('1/4 Building content script...');
  await build({
    root,
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(root, 'src/content/content.ts'),
        name: 'DrivePinsContent',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
    },
  });

  // 2. Build Service Worker as ES module
  console.log('2/4 Building background service worker...');
  await build({
    root,
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(root, 'src/background/service-worker.ts'),
        formats: ['es'],
        fileName: () => 'background.js',
      },
    },
  });

  // 3. Build Popup HTML + Assets
  console.log('3/4 Building popup page...');
  await build({
    root,
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: path.resolve(root, 'src/popup/popup.html'),
        },
        output: {
          entryFileNames: 'popup.js',
          assetFileNames: (asset) => {
            if (asset.name && asset.name.endsWith('.css')) return 'popup.css';
            return 'assets/[name][extname]';
          },
        },
      },
    },
  });

  // Move popup.html from dist/src/popup/popup.html to dist/popup.html if nested
  const nestedPopup = path.resolve(dist, 'src/popup/popup.html');
  if (fs.existsSync(nestedPopup)) {
    let popupHtml = fs.readFileSync(nestedPopup, 'utf8');
    // Normalize relative paths in HTML
    popupHtml = popupHtml.replace(/href="[^"]*popup\.css"/g, 'href="popup.css"');
    popupHtml = popupHtml.replace(/src="[^"]*popup\.js"/g, 'src="popup.js"');
    fs.writeFileSync(path.resolve(dist, 'popup.html'), popupHtml);
    fs.rmSync(path.resolve(dist, 'src'), { recursive: true, force: true });
  }

  // 4. Copy Manifest and Icons
  console.log('4/4 Copying manifest and icons...');
  fs.copyFileSync(path.resolve(root, 'manifest.json'), path.resolve(dist, 'manifest.json'));

  const iconsDir = path.resolve(dist, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });
  const srcIcons = path.resolve(root, 'public/icons');
  if (fs.existsSync(srcIcons)) {
    for (const file of fs.readdirSync(srcIcons)) {
      fs.copyFileSync(path.join(srcIcons, file), path.join(iconsDir, file));
    }
  }

  console.log('Build complete! Output in dist/');
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
