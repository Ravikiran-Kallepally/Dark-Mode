import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';

// 1×1 moon-blue pixel PNG — placeholder icons until real assets are provided
const ICON_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HgAHAgF/p3phcwAAAABJRU5ErkJggg==';

function extensionPlugin() {
  return {
    name: 'dusk-extension',

    buildStart() {
      // Create placeholder icons if missing so TypeScript/build don't fail
      mkdirSync('src/assets', { recursive: true });
      for (const name of ['icon-16.png', 'icon-48.png', 'icon-128.png']) {
        const p = `src/assets/${name}`;
        if (!existsSync(p)) writeFileSync(p, Buffer.from(ICON_PNG_B64, 'base64'));
      }
    },

    closeBundle() {
      // --- popup ---
      mkdirSync('dist/popup', { recursive: true });
      copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
      copyFileSync('src/popup/popup.css',  'dist/popup/popup.css');

      // --- icons ---
      mkdirSync('dist/assets', { recursive: true });
      for (const name of ['icon-16.png', 'icon-48.png', 'icon-128.png']) {
        const src = `src/assets/${name}`;
        if (existsSync(src)) copyFileSync(src, `dist/assets/${name}`);
      }

      // --- manifest (already has dist-relative paths) ---
      copyFileSync('manifest.json', 'dist/manifest.json');
    },
  };
}

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'content/index':   resolve(__dirname, 'src/content/index.ts'),
        'service-worker':  resolve(__dirname, 'src/background/service-worker.ts'),
        'worker/analyzer': resolve(__dirname, 'src/worker/analyzer.ts'),
        'popup/popup':     resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        entryFileNames:  '[name].js',
        chunkFileNames:  'shared/[name]-[hash].js',
        assetFileNames:  '[name][extname]',
        format: 'es',
      },
    },
  },
  plugins: [extensionPlugin()],
});
