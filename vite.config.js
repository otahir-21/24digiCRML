import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Root-absolute assets so deep links work (e.g. /employee/slug refresh on Amplify).
// With base: './', the browser resolves ./assets/* relative to the URL path,
// so /employee/x → /employee/assets/* (404) → blank page.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
