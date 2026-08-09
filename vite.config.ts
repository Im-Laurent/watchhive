import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// public/ 의 모든 파일은 dist 로 복사되므로(.gitignore 무관),
// 개발 전용 데이터가 배포에 섞이지 않도록 빌드 후 dist 에서 제거한다.
//
// Vintage Maps 는 개발 전용 플래그 뒤에 있어 프로덕션 번들에서 코드가 통째로
// 빠지지만, public/ 의 데이터 파일은 코드와 무관하게 그대로 복사된다. 아무 데서도
// 읽지 않는 파일이 URL 로 노출되므로 여기서 함께 지운다.
// → Vintage Maps 를 실제로 공개할 때 places.json 을 이 목록에서 빼야 한다.
const DEV_ONLY_PUBLIC_FILES = ['places.candidates.json', 'places.json']

function stripDevData() {
  return {
    name: 'strip-dev-data',
    apply: 'build' as const,
    closeBundle() {
      for (const name of DEV_ONLY_PUBLIC_FILES) {
        const f = resolve(rootDir, 'dist', name)
        if (existsSync(f)) rmSync(f)
      }
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
