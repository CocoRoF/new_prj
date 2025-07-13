import './style.css'
import { GameEngine } from './game/GameEngine'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Hello World</h1>
    <div class="main-menu">
      <button id="enter-game">Enter</button>
      <button id="collection" disabled>Collection</button>
      <button id="exit-game">Exit</button>
    </div>
    <canvas id="game-canvas" style="display: none;"></canvas>
  </div>
`

// 게임 엔진 인스턴스
let gameEngine: GameEngine | null = null;

// Enter 버튼 - 게임 시작
document.querySelector('#enter-game')?.addEventListener('click', () => {
  try {
    // 메뉴 숨기고 게임 캔버스 표시
    const mainMenu = document.querySelector('.main-menu') as HTMLElement;
    const gameCanvas = document.querySelector('#game-canvas') as HTMLElement;
    const title = document.querySelector('h1') as HTMLElement;
    
    mainMenu.style.display = 'none';
    title.style.display = 'none';
    gameCanvas.style.display = 'block';
    
    // 게임 활성 모드 클래스 추가
    document.body.classList.add('game-active');
    
    // 게임 엔진 시작
    if (!gameEngine) {
      gameEngine = new GameEngine('game-canvas');
    }
    gameEngine.start();
    
    console.log('게임 시작!')
  } catch (error) {
    console.error('게임 시작 오류:', error);
    alert('게임 시작 중 오류가 발생했습니다: ' + error);
  }
});

// Collection 버튼 - 미구현
document.querySelector('#collection')?.addEventListener('click', () => {
  alert('Collection 기능은 아직 구현되지 않았습니다.');
});

// Exit 버튼 - 앱 종료
document.querySelector('#exit-game')?.addEventListener('click', async () => {
  // 간단하게 확인 후 창 닫기로 처리
  if (confirm('게임을 종료하시겠습니까?')) {
    try {
      // Tauri 환경에서는 window.close()가 앱을 종료합니다
      window.close();
    } catch (error) {
      console.log('창 닫기 실패:', error);
      // 마지막 대안
      window.location.reload();
    }
  }
});

// ESC 키로 메인 메뉴 돌아가기
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && gameEngine) {
    // 게임 정지
    gameEngine.stop();
    
    // 게임 활성 모드 클래스 제거
    document.body.classList.remove('game-active');
    
    // 메뉴 다시 표시
    const mainMenu = document.querySelector('.main-menu') as HTMLElement;
    const gameCanvas = document.querySelector('#game-canvas') as HTMLElement;
    const title = document.querySelector('h1') as HTMLElement;
    
    mainMenu.style.display = 'flex';
    title.style.display = 'block';
    gameCanvas.style.display = 'none';
    
    console.log('메인 메뉴로 돌아가기');
  }
});
