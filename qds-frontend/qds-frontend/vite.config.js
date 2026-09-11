import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Port 3000 bound on 0.0.0.0 so one build serves the LAN multi-machine test
// (v1 plan §7): every machine opens the same origin with a different ?role=.
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '0.0.0.0', port: 3000, strictPort: true },
  base: './',
})
