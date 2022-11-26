import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

import Vue from '@vitejs/plugin-vue';
import mkcert from'vite-plugin-mkcert';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

export default defineConfig({
  publicDir: fileURLToPath(new URL('public', import.meta.url)),
  root: 'src',
  envDir: fileURLToPath(new URL('configs', import.meta.url)),
  build: {
    sourcemap: process.env.SOURCE_MAP === 'true',
    outDir: fileURLToPath(new URL('dist', import.meta.url)),
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('src/index.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  server: {
    https: true,
  },
  plugins: [
    mkcert(),
    Vue({
      include: [/\.vue$/],
    }),
    createSvgIconsPlugin({
      iconDirs: [fileURLToPath(new URL('src/assets/icons', import.meta.url))],
      symbolId: 'icon-[dir]-[name]',
    }),
  ],
});
