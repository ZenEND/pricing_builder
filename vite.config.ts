import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// On GitHub Actions → /<repo-name>/  |  locally → /
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
