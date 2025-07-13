import './game/style.css'
import { GameEngine } from './game/GameEngine'

const gameApp = document.querySelector<HTMLDivElement>('#game-app')!

if (gameApp) {
  // 메인 메뉴로 돌아가기 버튼 UI 추가
  gameApp.innerHTML = `
    <div class="game-container">
      <div class="game-header">
        <button id="back-to-menu" class="back-button">
          ← 메인 메뉴로
        </button>
        <h1>Hello World Game</h1>
      </div>
      <canvas id="gameCanvas"></canvas>
    </div>
  `

  // 게임 엔진 초기화
  const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!
  const gameEngine = new GameEngine(canvas)
  
  // 게임 시작
  gameEngine.start()

  // 메인 메뉴로 돌아가기 버튼 이벤트
  document.getElementById('back-to-menu')?.addEventListener('click', () => {
    window.location.href = '/index.html'
  })

  // ESC 키로도 메인 메뉴로 돌아갈 수 있게
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.location.href = '/index.html'
    }
  })
}
