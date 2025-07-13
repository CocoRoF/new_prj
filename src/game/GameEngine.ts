/**
 * Vampire Survivors 스타일 게임 엔진
 */
import { Player } from './Player';
import { Enemy, EnemySpawner } from './Enemy';
import { Projectile, RapidFire, Shotgun } from './Weapon';
import { Item, ItemSpawner, ItemType } from './Item';

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
    private player: Player;
    private enemies: Enemy[] = [];
    private enemySpawner: EnemySpawner;
    private projectiles: Projectile[] = [];
    private items: Item[] = [];
    private itemSpawner: ItemSpawner;
    private score: number = 0;

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
        // 캔버스 크기 설정
        this.canvas.width = 800;
        this.canvas.height = 600;

        // 캔버스 스타일 설정
        this.canvas.style.border = '2px solid #ff6b6b';
        this.canvas.style.backgroundColor = '#1a1a1a';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
    }

    private setupEventListeners(): void {
        // 키보드 이벤트
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // 마우스 이벤트
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    private initializeGame(): void {
        // 플레이어를 캔버스 중앙에 생성
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);

        // 적 스포너 생성
        this.enemySpawner = new EnemySpawner();

        // 아이템 스포너 생성
        this.itemSpawner = new ItemSpawner();

        // 배열들 초기화
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.score = 0;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (this.player) {
            this.player.setKeyState(event.key.toLowerCase(), true);
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

        const currentTime = performance.now();

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
                    
                    // 발사체 제거
                    this.projectiles.splice(i, 1);
                    
                    // 적이 죽었으면 점수 및 경험치 획득
                    if (!enemy.isAlive()) {
                        this.score += enemy.experienceValue;
                        this.player.gainExperience(enemy.experienceValue);
                        
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
                console.log(`💥 플레이어가 데미지를 받았습니다! 체력: ${this.player.currentHealth}`);

                // 적 제거 (충돌 후)
                this.enemies.splice(i, 1);
                continue;
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
        // 화면 클리어
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
        this.ctx.fillText(`발사체 수: ${this.projectiles.length}`, 10, 120);

        // 체력바
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = 10;
        const healthBarY = 135;

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

        // 조작법 표시
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('WASD: 이동 | 자동 공격', 10, this.canvas.height - 20);
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

    // 게터 메서드들
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}
