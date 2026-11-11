import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  srcDir: './app',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [react()],
  server: { host: '127.0.0.1' },
});
