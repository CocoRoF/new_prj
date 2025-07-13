import './styles/main-menu.css'

const app = document.querySelector<HTMLDivElement>('#app')!

if (app) {
  app.innerHTML = `
    <div class="main-layout">
      <div class="image-section">
        <div class="game-preview">
          <h2>Hello World</h2>
          <p>새로운 세계로의 모험이 시작됩니다</p>
        </div>
      </div>
      
      <div class="menu-section">
        <div class="menu-container">
          <h1 class="game-title">Hello World</h1>
          <nav class="main-menu">
            <button id="enterGame" class="menu-button primary">
              Enter
            </button>
            <button id="collection" class="menu-button">
              Collection
            </button>
            <button id="exitGame" class="menu-button">
              Exit
            </button>
          </nav>
          <div class="menu-footer">
            <p>Ver 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  `

  // 메뉴 버튼 이벤트 리스너
  document.getElementById('enterGame')?.addEventListener('click', () => {
    // 게임 페이지로 이동
    window.location.href = '/game.html'
  })

  document.getElementById('collection')?.addEventListener('click', () => {
    console.log('Collection menu clicked')
    // TODO: 컬렉션 페이지 구현 예정
    alert('컬렉션 기능은 개발 중입니다.')
  })

  document.getElementById('exitGame')?.addEventListener('click', () => {
    console.log('Exit game clicked')
    // Tauri 환경에서는 window.close() 사용
    window.close()
  })
}
