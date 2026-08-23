import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Host-agnostic by default. The Vercel preset only activates on Vercel's
// build runners (they set VERCEL=1), so local builds and any future host
// keep the standard Node server output.
const isVercel = process.env.VERCEL === '1'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    viteReact(),
    ...(isVercel ? [nitro({ preset: 'vercel' })] : []),
    tailwindcss(),
  ],
})
