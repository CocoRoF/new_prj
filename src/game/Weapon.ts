import { Vector2D } from './Player';
import { Enemy } from './Enemy';

/**
 * 발사체 클래스
 */
export class Projectile {
  public position: Vector2D;
  public velocity: Vector2D;
  public damage: number;
  public radius: number = 3;
  public speed: number = 400; // pixels per second
  public lifeTime: number = 2000; // 2초 후 소멸
  public age: number = 0;
  public color: string = '#ffff00';

  constructor(x: number, y: number, targetX: number, targetY: number, damage: number = 20) {
    this.position = new Vector2D(x, y);
    this.damage = damage;

    // 목표 방향으로 속도 벡터 계산
    const direction = new Vector2D(targetX - x, targetY - y).normalize();
    this.velocity = direction.multiply(this.speed);
  }

  public update(deltaTime: number): void {
    // 위치 업데이트
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);

    // 생존 시간 업데이트
    this.age += deltaTime;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // 발사체 그리기
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 발사체 테두리 (더 잘 보이게)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  public isAlive(): boolean {
    return this.age < this.lifeTime;
  }

  public isCollidingWith(enemy: Enemy): boolean {
    const distance = this.position.distance(enemy.position);
    return distance < (this.radius + enemy.radius);
  }

  public isOutOfBounds(canvasWidth: number, canvasHeight: number): boolean {
    return (
      this.position.x < -this.radius ||
      this.position.x > canvasWidth + this.radius ||
      this.position.y < -this.radius ||
      this.position.y > canvasHeight + this.radius
    );
  }
}

/**
 * 무기 클래스
 */
export class Weapon {
  public name: string;
  public damage: number;
  public fireRate: number; // shots per second
  public range: number;
  public level: number = 1;
  protected lastFireTime: number = 0;

  constructor(name: string, damage: number, fireRate: number, range: number) {
    this.name = name;
    this.damage = damage;
    this.fireRate = fireRate;
    this.range = range;
  }

  public canFire(currentTime: number): boolean {
    const fireInterval = 1000 / this.fireRate; // milliseconds between shots
    return (currentTime - this.lastFireTime) >= fireInterval;
  }

  public fire(
    playerX: number,
    playerY: number,
    enemies: Enemy[],
    projectiles: Projectile[],
    currentTime: number
  ): void {
    if (!this.canFire(currentTime)) return;

    // 가장 가까운 적 찾기
    const target = this.findNearestEnemy(playerX, playerY, enemies);
    if (!target) return;

    // 발사체 생성
    const projectile = new Projectile(playerX, playerY, target.position.x, target.position.y, this.damage);
    projectiles.push(projectile);

    this.lastFireTime = currentTime;
  }

  protected findNearestEnemy(playerX: number, playerY: number, enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDistance = this.range;

    for (const enemy of enemies) {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - playerX, 2) + Math.pow(enemy.position.y - playerY, 2)
      );

      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  public upgrade(): void {
    this.level++;
    this.damage += 5;
    this.fireRate *= 1.1; // 10% 더 빠르게
    this.range += 20;
    
    console.log(`🔫 ${this.name} 업그레이드! 레벨 ${this.level}`);
  }
}

/**
 * 기본 무기들
 */
export class BasicGun extends Weapon {
  constructor() {
    super('기본 총', 20, 2, 150); // 이름, 데미지, 초당 발사수, 사거리
  }
}

export class RapidFire extends Weapon {
  constructor() {
    super('연발총', 10, 5, 120);
  }
}

export class Shotgun extends Weapon {
  constructor() {
    super('샷건', 30, 1, 100);
  }

  // 샷건은 여러 발사체를 동시에 발사
  public fire(
    playerX: number,
    playerY: number,
    enemies: Enemy[],
    projectiles: Projectile[],
    currentTime: number
  ): void {
    if (!this.canFire(currentTime)) return;

    const target = this.findNearestEnemy(playerX, playerY, enemies);
    if (!target) return;

    // 샷건은 3발을 퍼뜨려서 발사
    const spreadAngle = Math.PI / 6; // 30도 각도
    const baseAngle = Math.atan2(target.position.y - playerY, target.position.x - playerX);

    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + (i * spreadAngle / 2);
      const targetX = playerX + Math.cos(angle) * 100;
      const targetY = playerY + Math.sin(angle) * 100;
      
      const projectile = new Projectile(playerX, playerY, targetX, targetY, this.damage);
      projectiles.push(projectile);
    }

    this.lastFireTime = currentTime;
  }
}
