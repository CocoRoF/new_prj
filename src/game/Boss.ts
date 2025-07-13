import { Vector2D, Player } from './Player';
import { Enemy } from './Enemy';

/**
 * 보스 몬스터 클래스
 */
export class Boss extends Enemy {
  public maxHealth: number;
  public attackTimer: number = 0;
  public attackInterval: number = 3000; // 3초마다 특별 공격
  public phase: number = 1;
  public isInvulnerable: boolean = false;
  public invulnerabilityTimer: number = 0;
  public movePattern: string = 'chase';
  public patternTimer: number = 0;
  public bossProjectiles: BossProjectile[] = [];
  public canvasWidth: number = 800;
  public canvasHeight: number = 600;

  constructor(x: number, y: number, bossType: string = 'basic') {
    super(x, y);
    
    // 보스별 설정
    switch (bossType) {
      case 'flame_lord':
        this.setupFlameLord();
        break;
      case 'ice_queen':
        this.setupIceQueen();
        break;
      default:
        this.setupBasicBoss();
    }
    
    this.maxHealth = this.currentHealth;
  }

  private setupBasicBoss(): void {
    this.radius = 25;
    this.speed = 30;
    this.currentHealth = 200;
    this.damage = 25;
    this.experienceValue = 500;
    this.color = '#8B0000';
  }

  private setupFlameLord(): void {
    this.radius = 30;
    this.speed = 40;
    this.currentHealth = 300;
    this.damage = 30;
    this.experienceValue = 750;
    this.color = '#FF4500';
    this.attackInterval = 2500;
  }

  private setupIceQueen(): void {
    this.radius = 28;
    this.speed = 25;
    this.currentHealth = 350;
    this.damage = 35;
    this.experienceValue = 800;
    this.color = '#00BFFF';
    this.attackInterval = 3500;
  }

  public update(deltaTime: number, player: Player): void {
    // 무적 시간 처리
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= deltaTime;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // 페이즈 변경 (체력에 따라)
    const healthPercent = this.currentHealth / this.maxHealth;
    if (healthPercent < 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed *= 1.3;
      this.attackInterval *= 0.7;
      console.log('🔥 보스가 분노했습니다! Phase 2');
    }

    // 이동 패턴 업데이트
    this.updateMovementPattern(deltaTime, player, this.canvasWidth, this.canvasHeight);
    
    // 공격 패턴 업데이트
    this.updateAttackPattern(deltaTime, player, this.canvasWidth, this.canvasHeight);

    // 보스 발사체 업데이트
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.bossProjectiles[i];
      projectile.update(deltaTime);

      if (!projectile.isAlive() || projectile.isOutOfBounds(this.canvasWidth, this.canvasHeight)) {
        this.bossProjectiles.splice(i, 1);
      }
    }

    // 위치 업데이트 (경계 체크 포함)
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);

    // 캔버스 경계 체크
    this.position.x = Math.max(this.radius, Math.min(this.canvasWidth - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(this.canvasHeight - this.radius, this.position.y));
  }

  private updateMovementPattern(deltaTime: number, player: Player, canvasWidth: number, canvasHeight: number): void {
    this.patternTimer += deltaTime;

    // 5초마다 이동 패턴 변경
    if (this.patternTimer >= 5000) {
      const patterns = ['chase', 'circle', 'teleport'];
      this.movePattern = patterns[Math.floor(Math.random() * patterns.length)];
      this.patternTimer = 0;
    }

    switch (this.movePattern) {
      case 'chase':
        // 플레이어 추적
        const direction = new Vector2D(
          player.position.x - this.position.x,
          player.position.y - this.position.y
        ).normalize();
        this.velocity = direction.multiply(this.speed);
        break;

      case 'circle':
        // 플레이어 주위를 원형으로 이동
        const angle = this.patternTimer * 0.002;
        const centerX = player.position.x;
        const centerY = player.position.y;
        const radius = 100;
        
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;
        
        const circleDirection = new Vector2D(
          targetX - this.position.x,
          targetY - this.position.y
        ).normalize();
        this.velocity = circleDirection.multiply(this.speed * 0.8);
        break;

      case 'teleport':
        // 순간이동 (3초마다)
        if (this.patternTimer % 3000 < deltaTime) {
          this.position.x = Math.random() * (canvasWidth - 100) + 50;
          this.position.y = Math.random() * (canvasHeight - 100) + 50;
          this.velocity = new Vector2D(0, 0);
        }
        break;
    }
  }

  private updateAttackPattern(deltaTime: number, player: Player, _canvasWidth: number, _canvasHeight: number): void {
    this.attackTimer += deltaTime;

    if (this.attackTimer >= this.attackInterval) {
      this.performSpecialAttack(player);
      this.attackTimer = 0;
    }
  }

  private performSpecialAttack(player: Player): void {
    const attackTypes = ['burst', 'wave', 'spiral'];
    const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

    switch (attackType) {
      case 'burst':
        // 8방향 폭발 공격
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const targetX = this.position.x + Math.cos(angle) * 200;
          const targetY = this.position.y + Math.sin(angle) * 200;
          
          const projectile = new BossProjectile(
            this.position.x, this.position.y, targetX, targetY, 'fire'
          );
          this.bossProjectiles.push(projectile);
        }
        console.log('💥 보스가 폭발 공격을 사용했습니다!');
        break;

      case 'wave':
        // 플레이어를 향한 3연발
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const spread = (i - 1) * 0.3; // 약간의 퍼짐
            const angle = Math.atan2(
              player.position.y - this.position.y,
              player.position.x - this.position.x
            ) + spread;
            
            const targetX = this.position.x + Math.cos(angle) * 300;
            const targetY = this.position.y + Math.sin(angle) * 300;
            
            const projectile = new BossProjectile(
              this.position.x, this.position.y, targetX, targetY, 'ice'
            );
            this.bossProjectiles.push(projectile);
          }, i * 200);
        }
        console.log('❄️ 보스가 연속 공격을 사용했습니다!');
        break;

      case 'spiral':
        // 나선형 공격
        for (let i = 0; i < 12; i++) {
          setTimeout(() => {
            const angle = (i / 12) * Math.PI * 2 + (Date.now() * 0.01);
            const targetX = this.position.x + Math.cos(angle) * 250;
            const targetY = this.position.y + Math.sin(angle) * 250;
            
            const projectile = new BossProjectile(
              this.position.x, this.position.y, targetX, targetY, 'dark'
            );
            this.bossProjectiles.push(projectile);
          }, i * 100);
        }
        console.log('🌀 보스가 나선 공격을 사용했습니다!');
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // 무적 상태일 때 깜빡임 효과
    if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2) {
      return;
    }

    // 보스 오라 효과
    const glowIntensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    const glowRadius = this.radius + 10 + glowIntensity * 8;
    
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, glowRadius
    );
    gradient.addColorStop(0, this.color + '60');
    gradient.addColorStop(1, this.color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 보스 몸체
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 보스 테두리 (두껍게)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 페이즈 표시
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${this.phase}`, this.position.x, this.position.y + 5);

    // 체력바 (더 크게)
    const barWidth = this.radius * 3;
    const barHeight = 6;
    const barY = this.position.y - this.radius - 20;

    // 배경
    ctx.fillStyle = '#660000';
    ctx.fillRect(this.position.x - barWidth / 2, barY, barWidth, barHeight);

    // 현재 체력
    const healthPercent = this.currentHealth / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(this.position.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

    // 체력 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`${this.currentHealth}/${this.maxHealth}`, this.position.x, barY - 5);

    // 보스 발사체 렌더링
    for (const projectile of this.bossProjectiles) {
      projectile.render(ctx);
    }
  }

  public takeDamage(damage: number): void {
    if (this.isInvulnerable) return;

    super.takeDamage(damage);
    
    // 데미지를 받으면 잠시 무적
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 200; // 0.2초
  }
}

/**
 * 보스 발사체 클래스
 */
export class BossProjectile {
  public position: Vector2D;
  public velocity: Vector2D;
  public damage: number = 40;
  public radius: number = 6;
  public speed: number = 200;
  public lifeTime: number = 5000;
  public age: number = 0;
  public type: string;
  public color: string;

  constructor(x: number, y: number, targetX: number, targetY: number, type: string = 'fire') {
    this.position = new Vector2D(x, y);
    this.type = type;

    // 타입별 설정
    switch (type) {
      case 'fire':
        this.color = '#FF4500';
        this.speed = 180;
        this.damage = 35;
        break;
      case 'ice':
        this.color = '#00BFFF';
        this.speed = 220;
        this.damage = 30;
        break;
      case 'dark':
        this.color = '#8B008B';
        this.speed = 160;
        this.damage = 45;
        break;
      default:
        this.color = '#ff0000';
    }

    // 목표 방향으로 속도 벡터 계산
    const direction = new Vector2D(targetX - x, targetY - y).normalize();
    this.velocity = direction.multiply(this.speed);
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);
    this.age += deltaTime;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // 발사체 글로우
    const glowRadius = this.radius + 3;
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, glowRadius
    );
    gradient.addColorStop(0, this.color + 'CC');
    gradient.addColorStop(1, this.color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 발사체 본체
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  public isAlive(): boolean {
    return this.age < this.lifeTime;
  }

  public isOutOfBounds(canvasWidth: number, canvasHeight: number): boolean {
    return (
      this.position.x < -this.radius ||
      this.position.x > canvasWidth + this.radius ||
      this.position.y < -this.radius ||
      this.position.y > canvasHeight + this.radius
    );
  }

  public isCollidingWith(player: Player): boolean {
    const distance = this.position.distance(player.position);
    return distance < (this.radius + player.radius);
  }
}
