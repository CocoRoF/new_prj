import { defineConfig } from 'vite'

export default defineConfig({
  // 멀티페이지 설정
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        game: './game.html'
      }
    }
  },
  
  // 개발 서버 설정
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0'
  },

  // Tauri 호환성을 위한 설정
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  
  // 빌드 최적화
  optimizeDeps: {
    include: []
  }
})
