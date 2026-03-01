import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    // nodePolyfills MUST come before react() — it shims process, buffer, etc.
    // which react-simple-maps (d3-geo) needs on Node.js v20+
    nodePolyfills({
      globals: { process: true, Buffer: true, global: true },
      protocolImports: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['react-simple-maps', 'react-leaflet', 'leaflet', 'lucide-react'],
  },
})
