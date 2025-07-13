/**
 * 사운드 매니저 클래스
 */
export class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private effectVolume: number = 0.5;
  private isMuted: boolean = false;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds(): void {
    // Web Audio API를 사용한 사운드 생성 (실제 파일 없이)
    this.createBeepSound('shoot', 200, 0.1, 'sine');
    this.createBeepSound('hit', 150, 0.15, 'square');
    this.createBeepSound('pickup', 400, 0.1, 'triangle');
    this.createBeepSound('enemy_death', 100, 0.2, 'sawtooth');
    this.createBeepSound('level_up', 500, 0.3, 'sine');
    this.createBeepSound('boss_spawn', 80, 0.5, 'sawtooth');
    this.createBeepSound('boss_attack', 120, 0.3, 'square');
    this.createBeepSound('player_hurt', 180, 0.2, 'triangle');
  }

  private createBeepSound(name: string, frequency: number, duration: number, waveType: OscillatorType = 'sine'): void {
    // 더미 오디오 엘리먼트 생성 (실제로는 Web Audio API 사용)
    const audio = new Audio();
    
    // Web Audio API로 비프음 생성
    this.generateBeepSound(audio, frequency, duration, waveType);
    
    this.sounds[name] = audio;
  }

  private generateBeepSound(audio: HTMLAudioElement, frequency: number, duration: number, waveType: OscillatorType): void {
    // Web Audio API 컨텍스트 생성
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 오실레이터와 게인 노드 생성
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = waveType;
      
      // 볼륨 엔벨로프
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration + 0.01);
      
      // 재생 메서드 오버라이드
      audio.play = () => {
        const newOscillator = audioContext.createOscillator();
        const newGainNode = audioContext.createGain();
        
        newOscillator.connect(newGainNode);
        newGainNode.connect(audioContext.destination);
        
        newOscillator.frequency.value = frequency;
        newOscillator.type = waveType;
        
        newGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        newGainNode.gain.linearRampToValueAtTime(this.effectVolume * 0.2, audioContext.currentTime + 0.01);
        newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        newGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration + 0.01);
        
        newOscillator.start(audioContext.currentTime);
        newOscillator.stop(audioContext.currentTime + duration + 0.02);
        
        return Promise.resolve();
      };
    } catch (error) {
      console.warn('Web Audio API 사용할 수 없음:', error);
      // 폴백: 빈 재생 함수
      audio.play = () => Promise.resolve();
    }
  }

  public playSound(soundName: string): void {
    if (this.isMuted) return;

    const sound = this.sounds[soundName];
    if (sound) {
      try {
        sound.currentTime = 0;
        sound.play().catch(error => {
          console.warn(`사운드 재생 실패 (${soundName}):`, error);
        });
      } catch (error) {
        console.warn(`사운드 재생 오류 (${soundName}):`, error);
      }
    }
  }

  public playMusic(musicName: string): void {
    if (this.isMuted) return;
    
    // 실제 구현에서는 배경음악 파일을 로드하고 재생
    console.log(`배경음악 재생: ${musicName}`);
  }

  public stopMusic(): void {
    // 실제 구현에서는 현재 재생 중인 배경음악 정지
    console.log('배경음악 정지');
  }

  public setMusicVolume(volume: number): void {
    // 음악 볼륨 설정 (현재는 비프음만 사용)
    console.log(`Music volume set to: ${Math.max(0, Math.min(1, volume))}`);
  }

  public setEffectVolume(volume: number): void {
    this.effectVolume = Math.max(0, Math.min(1, volume));
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    console.log(this.isMuted ? '🔇 사운드 음소거' : '🔊 사운드 켜짐');
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  // 게임 이벤트별 사운드 재생 메서드들
  public playShootSound(): void {
    this.playSound('shoot');
  }

  public playHitSound(): void {
    this.playSound('hit');
  }

  public playPickupSound(): void {
    this.playSound('pickup');
  }

  public playEnemyDeathSound(): void {
    this.playSound('enemy_death');
  }

  public playLevelUpSound(): void {
    this.playSound('level_up');
  }

  public playBossSpawnSound(): void {
    this.playSound('boss_spawn');
  }

  public playBossAttackSound(): void {
    this.playSound('boss_attack');
  }

  public playPlayerHurtSound(): void {
    this.playSound('player_hurt');
  }

  // 배경음악 제어
  public startGameMusic(): void {
    this.playMusic('game_bgm');
  }

  public startBossMusic(): void {
    this.playMusic('boss_bgm');
  }
}

// 전역 사운드 매니저 인스턴스
export const soundManager = new SoundManager();
