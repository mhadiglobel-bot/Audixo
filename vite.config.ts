import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({mode}) => {
 const env=loadEnv(mode,process.cwd(),'')
 const origin=env.VITE_SITE_URL||(env.VERCEL_PROJECT_PRODUCTION_URL?`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`:env.VERCEL_URL?`https://${env.VERCEL_URL}`:'')
 return {
  define:{'import.meta.env.VITE_SITE_URL':JSON.stringify(origin)},
  plugins:[react()],
  worker:{format:'es'},
  optimizeDeps:{include:['@breezystack/lamejs']},
  server:{port:5173,headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless'},proxy:{'/api':{target:'http://127.0.0.1:8787'}}},
  preview:{port:4173,headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless'}},
  build:{target:'es2020',sourcemap:false,cssCodeSplit:true,chunkSizeWarningLimit:900,rollupOptions:{output:{manualChunks(id){if(id.includes('@breezystack/lamejs'))return'mp3-encoder';if(id.includes('react')||id.includes('react-router-dom'))return'react-vendor'}}}}
 }
})
