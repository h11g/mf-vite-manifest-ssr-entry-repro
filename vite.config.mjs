import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

// Browser-only remote: no `environments.ssr`, no `build.ssr`, no `--ssr`.
export default defineConfig({
  plugins: [
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: { './widget': './src/widget.js' },
      shared: {},
      dts: false,
    }),
  ],
  build: { target: 'esnext' },
});
