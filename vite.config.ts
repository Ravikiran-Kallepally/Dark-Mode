import { defineConfig, build as viteBuild } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';

// 1×1 moon-blue pixel PNG — placeholder until real icons are provided
const ICON_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HgAHAgF/p3phcwAAAABJRU5ErkJggg==';

// Build a single TS entry as a self-contained IIFE (no import statements in output).
// Used for content scripts and web workers where ES module imports are unreliable.
async function buildIIFE(entry: string, outDir: string, outFile: string, name: string) {
  await viteBuild({
    configFile: false,
    logLevel: 'warn',
    build: {
      target: 'es2020',
      outDir,
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, entry),
        formats: ['iife'],
        name,
        fileName: () => outFile,
      },
    },
  });
}

function extensionPlugin() {
  return {
    name: 'dusk-extension',

    buildStart() {
      mkdirSync('src/assets', { recursive: true });
      for (const n of ['icon-16.png', 'icon-48.png', 'icon-128.png']) {
        const p = `src/assets/${n}`;
        if (!existsSync(p)) writeFileSync(p, Buffer.from(ICON_PNG_B64, 'base64'));
      }
    },

    async closeBundle() {
      // Content script → IIFE: classic script, no import statements, works in all Chrome versions
      await buildIIFE('src/content/index.ts',  'dist/content', 'index.js',    '__dusk_content__');

      // Web worker → IIFE: created as classic Worker (no {type:'module'} needed)
      await buildIIFE('src/worker/analyzer.ts', 'dist/worker',  'analyzer.js', '__dusk_worker__');

      // Popup assets
      mkdirSync('dist/popup', { recursive: true });
      copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
      copyFileSync('src/popup/popup.css',  'dist/popup/popup.css');

      // Icons
      mkdirSync('dist/assets', { recursive: true });
      for (const n of ['icon-16.png', 'icon-48.png', 'icon-128.png']) {
        const src = `src/assets/${n}`;
        if (existsSync(src)) copyFileSync(src, `dist/assets/${n}`);
      }

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
      // Content script and analyzer are built separately as IIFEs (see closeBundle above).
      // Service worker and popup use ES modules — both contexts support them natively.
      input: {
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'popup/popup':    resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: '[name][extname]',
        format: 'es',
      },
    },
  },
  plugins: [extensionPlugin()],
});
