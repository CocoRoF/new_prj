import { Vector2D, Player } from './Player';

/**
 * 적 캐릭터 클래스
 */
export class Enemy {
    public position: Vector2D;
    public velocity: Vector2D;
    public radius: number = 8;
    public speed: number = 50; // pixels per second
    public maxHealth: number = 30;
    public currentHealth: number = 30;
    public damage: number = 10;
    public experienceValue: number = 25;
    public color: string = '#ff4444';

    constructor(x: number, y: number) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
    }

    public update(deltaTime: number, player: Player): void {
        // 플레이어를 향해 이동
        const direction = new Vector2D(
            player.position.x - this.position.x,
            player.position.y - this.position.y
        ).normalize();

        this.velocity = direction.multiply(this.speed);

        // 위치 업데이트
        this.position.x += this.velocity.x * (deltaTime / 1000);
        this.position.y += this.velocity.y * (deltaTime / 1000);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        // 적 몸체
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 체력바 표시 (체력이 최대가 아닐 때만)
        if (this.currentHealth < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 3;
            const barY = this.position.y - this.radius - 8;

            // 배경 (빨간색)
            ctx.fillStyle = '#660000';
            ctx.fillRect(this.position.x - barWidth / 2, barY, barWidth, barHeight);

            // 현재 체력 (초록색)
            const healthPercent = this.currentHealth / this.maxHealth;
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.position.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        }
    }

    public takeDamage(damage: number): void {
        this.currentHealth -= damage;
        if (this.currentHealth < 0) {
            this.currentHealth = 0;
        }
    }

    public isAlive(): boolean {
        return this.currentHealth > 0;
    }

    public isCollidingWith(other: { position: Vector2D; radius: number }): boolean {
        const distance = this.position.distance(other.position);
        return distance < (this.radius + other.radius);
    }
}

/**
 * 적 스폰 시스템
 */
export class EnemySpawner {
    private spawnTimer: number = 0;
    private spawnInterval: number = 2000; // 2초마다 스폰
    private maxEnemies: number = 20;

    public update(
        deltaTime: number,
        enemies: Enemy[],
        canvasWidth: number,
        canvasHeight: number
    ): void {
        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval && enemies.length < this.maxEnemies) {
            this.spawnEnemy(enemies, canvasWidth, canvasHeight);
            this.spawnTimer = 0;

            // 시간이 지날수록 스폰 빈도 증가
            if (this.spawnInterval > 500) {
                this.spawnInterval *= 0.99;
            }
        }
    }

    private spawnEnemy(enemies: Enemy[], canvasWidth: number, canvasHeight: number): void {
        // 화면 밖 랜덤 위치에서 스폰
        const side = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
        let x, y;

        const margin = 50;

        switch (side) {
            case 0: // 위
                x = Math.random() * canvasWidth;
                y = -margin;
                break;
            case 1: // 오른쪽
                x = canvasWidth + margin;
                y = Math.random() * canvasHeight;
                break;
            case 2: // 아래
                x = Math.random() * canvasWidth;
                y = canvasHeight + margin;
                break;
            case 3: // 왼쪽
                x = -margin;
                y = Math.random() * canvasHeight;
                break;
            default:
                x = 0;
                y = 0;
        }

        enemies.push(new Enemy(x, y));
    }
}
