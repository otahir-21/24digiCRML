import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config tuned for S3 static hosting:
// - base: './' ensures relative asset paths in index.html and JS bundles.
export default defineConfig({
  plugins: [react()],
  base: './',
});
