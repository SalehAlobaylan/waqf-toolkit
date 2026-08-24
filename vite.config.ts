import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Nitro plugin is the ONLY hosting-related accommodation in this repo.
// It activates exclusively on Vercel's build runners (VERCEL=1), producing
// the serverless output Vercel requires. Local builds and every other host
// get the standard Node server output (dist/server/server.js).
// Delete this conditional when Vercel is no longer the host.
const nitroForHost =
  process.env.VERCEL === '1'
    ? [(await import('nitro/vite')).nitro({ preset: 'vercel' })]
    : []

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tanstackStart(), viteReact(), ...nitroForHost, tailwindcss()],
})
