import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project-page deploys live at https://<user>.github.io/learn-algo/.
// Local `npm run dev` / `npm run preview` keep serving at `/`.
const pages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  plugins: [react()],
  base: pages ? '/learn-algo/' : '/',
})
