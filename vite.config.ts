import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// public/ 의 모든 파일은 dist 로 복사되므로(.gitignore 무관),
// 개발 전용 후보 데이터가 배포에 섞이지 않도록 빌드 후 dist 에서 제거한다.
function stripDevData() {
  return {
    name: 'strip-dev-data',
    apply: 'build' as const,
    closeBundle() {
      const f = resolve(rootDir, 'dist', 'places.candidates.json')
      if (existsSync(f)) rmSync(f)
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), stripDevData()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
