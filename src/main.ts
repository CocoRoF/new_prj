import './style.css'
import { GameEngine } from './game/GameEngine'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Vampire Survivors Clone 🎮</h1>
    <p>TypeScript로 만드는 생존 슈팅 게임</p>
    <div class="game-controls">
      <button id="start-game">게임 시작</button>
      <button id="stop-game" disabled>게임 정지</button>
    </div>
    <canvas id="game-canvas"></canvas>
    <div class="game-info">
      <p>🎯 조작법: WASD로 이동, 마우스로 조준 (개발 중)</p>
      <p>🎮 현재 단계: 기본 게임 엔진 구축</p>
    </div>
  </div>
`

// 게임 엔진 인스턴스 생성
let gameEngine: GameEngine | null = null;

// 게임 시작 버튼 이벤트
document.querySelector('#start-game')?.addEventListener('click', () => {
  try {
    if (!gameEngine) {
      gameEngine = new GameEngine('game-canvas');
    }
    gameEngine.start();
    
    // 버튼 상태 변경
    const startBtn = document.querySelector('#start-game') as HTMLButtonElement;
    const stopBtn = document.querySelector('#stop-game') as HTMLButtonElement;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    console.log('🎮 게임 시작!')
  } catch (error) {
    console.error('게임 시작 오류:', error);
    alert('게임 시작 중 오류가 발생했습니다: ' + error);
  }
})

// 게임 정지 버튼 이벤트
document.querySelector('#stop-game')?.addEventListener('click', () => {
  if (gameEngine) {
    gameEngine.stop();
    
    // 버튼 상태 변경
    const startBtn = document.querySelector('#start-game') as HTMLButtonElement;
    const stopBtn = document.querySelector('#stop-game') as HTMLButtonElement;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    console.log('⏹️ 게임 정지!')
  }
})
