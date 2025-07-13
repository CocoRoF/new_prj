/**
 * Vampire Survivors 스타일 게임 엔진
 */
import { Player } from './Player';
import { Enemy, EnemySpawner } from './Enemy';
import { Projectile, RapidFire, Shotgun } from './Weapon';
import { Item, ItemSpawner } from './Item';
import { Boss } from './Boss';
import { soundManager } from './SoundManager';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isRunning: boolean = false;
    private lastTime: number = 0;
    private fps: number = 60;
    private targetFrameTime: number = 1000 / this.fps;
    private actualFps: number = 60;
    private fpsCounter: number = 0;
    private fpsTimer: number = 0;

    // 게임 객체들
    private player!: Player;
    private enemies: Enemy[] = [];
    private enemySpawner!: EnemySpawner;
    private projectiles: Projectile[] = [];
    private items: Item[] = [];
    private itemSpawner!: ItemSpawner;
    private boss: Boss | null = null;
    private score: number = 0;
    private gameTime: number = 0;
    private bossSpawnTime: number = 60000; // 1분 후 보스 스폰

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D rendering context');
        }
        this.ctx = ctx;

        this.setupCanvas();
        this.setupEventListeners();
        this.initializeGame();
    }

    private setupCanvas(): void {
        // 캔버스 크기를 뷰포트 크기로 설정
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 창 크기 변경 이벤트 리스너 추가
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // 캔버스 스타일 설정 (CSS로 관리되지만 확실히 하기 위해)
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '10';
        this.canvas.style.background = '#0f0f0f';
        this.canvas.style.cursor = 'crosshair';
        
        console.log(`Canvas initialized: ${this.canvas.width}x${this.canvas.height}`);
    }

    private resizeCanvas(): void {
        // 뷰포트 크기로 캔버스 크기 조정
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        console.log(`Canvas resized: ${this.canvas.width}x${this.canvas.height}`);
    }

    private setupEventListeners(): void {
        // 키보드 이벤트
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // 마우스 이벤트
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    private initializeGame(): void {
        // 플레이어를 화면 중앙에 생성 (실제 뷰포트 기준)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        this.player = new Player(centerX, centerY);

        // 적 스포너 생성
        this.enemySpawner = new EnemySpawner();

        // 아이템 스포너 생성
        this.itemSpawner = new ItemSpawner();

        // 배열들 초기화
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.boss = null;
        this.score = 0;
        this.gameTime = 0;

        // 배경음악 시작
        soundManager.startGameMusic();
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (this.player) {
            this.player.setKeyState(event.key.toLowerCase(), true);
        }
        
        // M 키로 사운드 토글
        if (event.key.toLowerCase() === 'm') {
            soundManager.toggleMute();
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (this.player) {
            this.player.setKeyState(event.key.toLowerCase(), false);
        }
    }

    private handleMouseMove(_event: MouseEvent): void {
        // 나중에 마우스 위치 추적 (무기 조준용)
        // 현재는 사용하지 않음
    }

    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('🎮 게임 엔진 시작!');
    }

    public stop(): void {
        this.isRunning = false;
        console.log('⏹️ 게임 엔진 정지');
    }

    private gameLoop(): void {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= this.targetFrameTime) {
            this.update(deltaTime);
            this.render();
            this.lastTime = currentTime;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    private update(deltaTime: number): void {
        // FPS 계산
        this.fpsCounter++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 1000) {
            this.actualFps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
        }

        // 게임 시간 업데이트
        this.gameTime += deltaTime;

        const currentTime = performance.now();

        // 보스 스폰 체크 (1분 후)
        if (!this.boss && this.gameTime >= this.bossSpawnTime) {
            this.spawnBoss();
        }

        // 플레이어 업데이트
        this.player.update(deltaTime, this.canvas.width, this.canvas.height);

        // 무기 발사
        this.player.fireWeapons(this.enemies, this.projectiles, currentTime);

        // 발사체 업데이트
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);

            // 발사체 수명 체크
            if (!projectile.isAlive() || projectile.isOutOfBounds(this.canvas.width, this.canvas.height)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // 발사체와 적의 충돌 검사
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (projectile.isCollidingWith(enemy)) {
                    // 적에게 데미지
                    enemy.takeDamage(projectile.damage);
                    soundManager.playHitSound();
                    
                    // 발사체 제거
                    this.projectiles.splice(i, 1);
                    
                    // 적이 죽었으면 점수 및 경험치 획득
                    if (!enemy.isAlive()) {
                        this.score += enemy.experienceValue;
                        this.player.gainExperience(enemy.experienceValue);
                        soundManager.playEnemyDeathSound();
                        
                        // 아이템 드롭 (20% 확률)
                        if (Math.random() < 0.2) {
                            this.itemSpawner.spawnItemAtPosition(this.items, enemy.position.x, enemy.position.y);
                        }
                        
                        this.enemies.splice(j, 1);
                        
                        // 레벨업 시 새 무기 획득 확률
                        if (Math.random() < 0.3) { // 30% 확률
                            this.giveRandomWeapon();
                        }
                    }
                    break;
                }
            }
        }

        // 적 스포너 업데이트
        this.enemySpawner.update(deltaTime, this.enemies, this.canvas.width, this.canvas.height);

        // 아이템 스포너 업데이트
        this.itemSpawner.update(deltaTime, this.items, this.enemies, this.canvas.width, this.canvas.height);

        // 아이템 업데이트 및 플레이어와의 충돌 검사
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(deltaTime);

            // 아이템 수명 체크
            if (!item.isAlive()) {
                this.items.splice(i, 1);
                continue;
            }

            // 플레이어와 아이템 충돌 검사
            if (item.isCollidingWith(this.player)) {
                // 아이템 효과 적용
                this.applyItemEffect(item);
                soundManager.playPickupSound();
                
                // 아이템 제거
                this.items.splice(i, 1);
            }
        }

        // 적들 업데이트
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player);

            // 플레이어와 적의 충돌 검사
            if (enemy.isCollidingWith(this.player)) {
                this.player.takeDamage(enemy.damage);
                soundManager.playPlayerHurtSound();
                console.log(`💥 플레이어가 데미지를 받았습니다! 체력: ${this.player.currentHealth}`);

                // 적 제거 (충돌 후)
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // 보스 업데이트
        if (this.boss) {
            this.boss.update(deltaTime, this.player);

            // 보스 발사체와 플레이어 충돌 검사
            for (let i = this.boss.bossProjectiles.length - 1; i >= 0; i--) {
                const bossProjectile = this.boss.bossProjectiles[i];
                if (bossProjectile.isCollidingWith(this.player)) {
                    this.player.takeDamage(bossProjectile.damage);
                    soundManager.playPlayerHurtSound();
                    console.log(`🔥 보스 공격에 맞았습니다! 체력: ${this.player.currentHealth}`);
                    this.boss.bossProjectiles.splice(i, 1);
                }
            }

            // 플레이어 발사체와 보스 충돌 검사
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const projectile = this.projectiles[i];
                if (this.boss.isCollidingWith(projectile)) {
                    this.boss.takeDamage(projectile.damage);
                    soundManager.playHitSound();
                    this.projectiles.splice(i, 1);
                    
                    // 보스가 죽었으면
                    if (!this.boss.isAlive()) {
                        this.score += this.boss.experienceValue;
                        this.player.gainExperience(this.boss.experienceValue);
                        soundManager.playEnemyDeathSound();
                        
                        // 보스 보상 (아이템 여러 개 드롭)
                        for (let j = 0; j < 5; j++) {
                            const offsetX = (Math.random() - 0.5) * 100;
                            const offsetY = (Math.random() - 0.5) * 100;
                            this.itemSpawner.spawnItemAtPosition(
                                this.items,
                                this.boss.position.x + offsetX,
                                this.boss.position.y + offsetY
                            );
                        }
                        
                        console.log('🎉 보스를 처치했습니다!');
                        this.boss = null;
                        
                        // 다음 보스 스폰 시간 설정 (2분 후)
                        this.bossSpawnTime = this.gameTime + 120000;
                        
                        // 배경음악을 일반 음악으로 변경
                        soundManager.startGameMusic();
                        break;
                    }
                }
            }

            // 플레이어와 보스 직접 충돌
            if (this.boss && this.boss.isCollidingWith(this.player)) {
                this.player.takeDamage(this.boss.damage);
                soundManager.playPlayerHurtSound();
                console.log(`👹 보스와 충돌했습니다! 체력: ${this.player.currentHealth}`);
            }
        }

        // 게임 오버 체크
        if (!this.player.isAlive()) {
            this.stop();
            console.log('💀 게임 오버!');
            alert(`게임 오버! 레벨: ${this.player.level}, 점수: ${this.score}`);
        }
    }

    private render(): void {
        // 캔버스 크기 재확인 (디버그용)
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        // 화면 클리어 - 더 명확한 배경색 사용
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 디버그: 캔버스 테두리 그리기 (임시)
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);

        // 플레이어 렌더링 (효과가 있으면 특별한 색상)
        if (this.player.hasActiveEffects()) {
            // 글로우 효과
            const glowIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            const glowRadius = this.player.radius + 5 + glowIntensity * 5;
            
            let glowColor = '#ffffff';
            if (this.player.speedBoostDuration > 0 && this.player.damageBoostDuration > 0) {
                glowColor = '#ff00ff'; // 보라색 (둘 다)
            } else if (this.player.speedBoostDuration > 0) {
                glowColor = '#00ff00'; // 초록색 (속도)
            } else if (this.player.damageBoostDuration > 0) {
                glowColor = '#ff8800'; // 주황색 (데미지)
            }
            
            const gradient = this.ctx.createRadialGradient(
                this.player.position.x, this.player.position.y, 0,
                this.player.position.x, this.player.position.y, glowRadius
            );
            gradient.addColorStop(0, glowColor + '40');
            gradient.addColorStop(1, glowColor + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.player.position.x, this.player.position.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.player.render(this.ctx);

        // 아이템 렌더링
        for (const item of this.items) {
            item.render(this.ctx);
        }

        // 발사체 렌더링
        for (const projectile of this.projectiles) {
            projectile.render(this.ctx);
        }

        // 적들 렌더링
        for (const enemy of this.enemies) {
            enemy.render(this.ctx);
        }

        // 보스 렌더링
        if (this.boss) {
            this.boss.render(this.ctx);
        }

        // UI 렌더링
        this.renderUI();
    }

    private renderUI(): void {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';

        // FPS 표시
        this.ctx.fillText(`FPS: ${this.actualFps}`, 10, 20);

        // 플레이어 정보
        this.ctx.fillText(`레벨: ${this.player.level}`, 10, 40);
        this.ctx.fillText(`점수: ${this.score}`, 10, 60);
        this.ctx.fillText(`경험치: ${this.player.experience}/${this.player.experienceToNext}`, 10, 80);
        this.ctx.fillText(`적 수: ${this.enemies.length}`, 10, 100);
        this.ctx.fillText(`발사체: ${this.projectiles.length} | 아이템: ${this.items.length}`, 10, 120);
        
        // 게임 시간 표시
        const gameTimeSeconds = Math.floor(this.gameTime / 1000);
        const minutes = Math.floor(gameTimeSeconds / 60);
        const seconds = gameTimeSeconds % 60;
        this.ctx.fillText(`시간: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 140);
        
        // 보스 정보
        if (this.boss) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillText(`👹 보스 체력: ${this.boss.currentHealth}/${this.boss.maxHealth}`, 10, 160);
        } else {
            const timeToNextBoss = Math.max(0, Math.ceil((this.bossSpawnTime - this.gameTime) / 1000));
            if (timeToNextBoss > 0) {
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.fillText(`다음 보스까지: ${timeToNextBoss}초`, 10, 160);
            }
        }

        // 체력바
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = 10;
        const healthBarY = 175;

        // 체력바 배경
        this.ctx.fillStyle = '#660000';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // 현재 체력
        const healthPercent = this.player.currentHealth / this.player.maxHealth;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

        // 체력 텍스트
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`${this.player.currentHealth}/${this.player.maxHealth}`, healthBarX + 5, healthBarY + 14);

        // 경험치바
        const expBarY = healthBarY + 25;
        const expBarHeight = 8;

        // 경험치바 배경
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(healthBarX, expBarY, healthBarWidth, expBarHeight);

        // 현재 경험치
        const expPercent = this.player.experience / this.player.experienceToNext;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(healthBarX, expBarY, healthBarWidth * expPercent, expBarHeight);

        // 무기 정보 표시
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('🔫 장착 무기:', 10, expBarY + 30);
        for (let i = 0; i < this.player.weapons.length; i++) {
            const weapon = this.player.weapons[i];
            this.ctx.fillText(`${weapon.name} Lv.${weapon.level}`, 20, expBarY + 50 + i * 16);
        }

        // 활성 효과 표시
        let effectY = expBarY + 50 + this.player.weapons.length * 16 + 20;
        if (this.player.hasActiveEffects()) {
            this.ctx.fillText('✨ 활성 효과:', 10, effectY);
            effectY += 20;
            
            if (this.player.speedBoostDuration > 0) {
                const remainingTime = Math.ceil(this.player.speedBoostDuration / 1000);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillText(`💨 속도 증가 (${remainingTime}초)`, 20, effectY);
                effectY += 16;
            }
            
            if (this.player.damageBoostDuration > 0) {
                const remainingTime = Math.ceil(this.player.damageBoostDuration / 1000);
                this.ctx.fillStyle = '#ff8800';
                this.ctx.fillText(`⚔️ 데미지 증가 (${remainingTime}초)`, 20, effectY);
                effectY += 16;
            }
        }

        // 조작법 표시
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('WASD: 이동 | M: 사운드 토글 | 자동 공격', 10, this.canvas.height - 20);
    }

    private applyItemEffect(item: Item): void {
        // 아이템 효과 적용
        item.apply(this.player);
        
        // 특별한 효과들
        switch (item.type) {
            case 'speed_boost':
                this.player.applySpeedBoost(50, 10000); // 50% 증가, 10초간
                break;
            case 'damage_boost':
                this.player.applyDamageBoost(30, 15000); // 30% 증가, 15초간
                break;
        }
    }

    private giveRandomWeapon(): void {
        const weaponTypes = [RapidFire, Shotgun];
        const WeaponClass = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        
        // 이미 같은 무기가 있으면 업그레이드, 없으면 새로 추가
        const existingWeapon = this.player.weapons.find(w => w.name === new WeaponClass().name);
        if (existingWeapon) {
            existingWeapon.upgrade();
        } else {
            this.player.addWeapon(new WeaponClass());
        }
    }

    private spawnBoss(): void {
        const bossTypes = ['basic', 'flame_lord', 'ice_queen'];
        const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        
        // 랜덤 위치에서 보스 스폰 (가장자리)
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // 위
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // 오른쪽
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // 아래
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // 왼쪽
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
            default:
                x = this.canvas.width / 2;
                y = this.canvas.height / 2;
        }
        
        this.boss = new Boss(x, y, bossType);
        this.boss.canvasWidth = this.canvas.width;
        this.boss.canvasHeight = this.canvas.height;
        
        soundManager.playBossSpawnSound();
        soundManager.startBossMusic();
        console.log(`👹 보스 등장! ${bossType}`);
    }

    // 게터 메서드들
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}
