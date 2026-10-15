import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Yukoto.github.io/',
  plugins: [react()],
  server: { host: '0.0.0.0' },
  build: { target: 'es2022' },
});
