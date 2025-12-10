import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separate Three's existing core/renderer modules without using private source imports.
        manualChunks(id) {
          if (id.endsWith('/three/build/three.core.js')) return 'three-core'
          if (id.endsWith('/three/build/three.module.js')) return 'three-renderer'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})
