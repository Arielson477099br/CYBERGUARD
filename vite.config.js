import { defineConfig } from 'vite';
export default defineConfig({
  // Expose only the two public Supabase client settings to browser code.
  envPrefix: ['VITE_', 'SUPABASE_'],
  build: { rollupOptions: { input: ['index.html','login.html','cadastro.html','incidentes.html','ameacas.html','relatorios.html','auditoria.html'] } }
});
