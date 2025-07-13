import { BasicGun, Weapon } from './Weapon';

/**
 * Vector2D - 2D 벡터 계산을 위한 클래스
 */
export class Vector2D {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    add(other: Vector2D): Vector2D {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    multiply(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    normalize(): Vector2D {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length === 0) return new Vector2D(0, 0);
        return new Vector2D(this.x / length, this.y / length);
    }

    distance(other: Vector2D): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * 플레이어 캐릭터 클래스
 */
export class Player {
    public position: Vector2D;
    public velocity: Vector2D;
    public radius: number = 15;
    public speed: number = 200; // pixels per second
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    public level: number = 1;
    public experience: number = 0;
    public experienceToNext: number = 100;

    // 무기 시스템
    public weapons: Weapon[] = [];
    public maxWeapons: number = 6;

    // 임시 효과 시스템
    public speedBoostMultiplier: number = 1.0;
    public speedBoostDuration: number = 0;
    public damageBoostMultiplier: number = 1.0;
    public damageBoostDuration: number = 0;

    // 입력 상태
    private keys: { [key: string]: boolean } = {};

    constructor(x: number, y: number) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);

        // 기본 무기 추가
        this.addWeapon(new BasicGun());
    }

    public setKeyState(key: string, pressed: boolean): void {
        this.keys[key] = pressed;
    }

    public update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
        // 임시 효과 시간 감소
        if (this.speedBoostDuration > 0) {
            this.speedBoostDuration -= deltaTime;
            if (this.speedBoostDuration <= 0) {
                this.speedBoostMultiplier = 1.0;
                console.log('💨 속도 증가 효과 종료');
            }
        }

        if (this.damageBoostDuration > 0) {
            this.damageBoostDuration -= deltaTime;
            if (this.damageBoostDuration <= 0) {
                this.damageBoostMultiplier = 1.0;
                console.log('⚔️ 데미지 증가 효과 종료');
            }
        }

        // 입력에 따른 이동 방향 계산
        let moveX = 0;
        let moveY = 0;

        if (this.keys['w'] || this.keys['W']) moveY -= 1;
        if (this.keys['s'] || this.keys['S']) moveY += 1;
        if (this.keys['a'] || this.keys['A']) moveX -= 1;
        if (this.keys['d'] || this.keys['D']) moveX += 1;

        // 대각선 이동시 속도 정규화
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        // 속도 적용 (속도 부스트 포함)
        const currentSpeed = this.speed * this.speedBoostMultiplier;
        this.velocity.x = moveX * currentSpeed;
        this.velocity.y = moveY * currentSpeed;

        // 위치 업데이트
        this.position.x += this.velocity.x * (deltaTime / 1000);
        this.position.y += this.velocity.y * (deltaTime / 1000);

        // 캔버스 경계 체크
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
        }
        if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
        }
        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
        }
        if (this.position.y + this.radius > canvasHeight) {
            this.position.y = canvasHeight - this.radius;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        // 플레이어 몸체 (파란색 원)
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 플레이어 중심점 (작은 흰 점)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // 이동 방향 표시 (속도가 있을 때만)
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const directionLength = 20;
            const normalizedVel = this.velocity.normalize();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(
                this.position.x + normalizedVel.x * directionLength,
                this.position.y + normalizedVel.y * directionLength
            );
            ctx.stroke();
        }
    }

    public takeDamage(damage: number): void {
        this.currentHealth -= damage;
        if (this.currentHealth < 0) {
            this.currentHealth = 0;
        }
    }

    public gainExperience(exp: number): void {
        this.experience += exp;
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }

    private levelUp(): void {
        this.experience -= this.experienceToNext;
        this.level++;
        this.experienceToNext = Math.floor(this.experienceToNext * 1.2);

        // 레벨업 보너스
        this.maxHealth += 10;
        this.currentHealth = this.maxHealth; // 체력 완전 회복
        this.speed += 5; // 속도 증가

        console.log(`🎉 레벨업! 레벨 ${this.level}`);
    }

    public isAlive(): boolean {
        return this.currentHealth > 0;
    }

    public addWeapon(weapon: Weapon): void {
        if (this.weapons.length < this.maxWeapons) {
            this.weapons.push(weapon);
            console.log(`🔫 새 무기 획득: ${weapon.name}`);
        } else {
            console.log('무기를 더 이상 장착할 수 없습니다.');
        }
    }

    public upgradeRandomWeapon(): void {
        if (this.weapons.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.weapons.length);
            this.weapons[randomIndex].upgrade();
        }
    }

    public fireWeapons(enemies: any[], projectiles: any[], currentTime: number): void {
        for (const weapon of this.weapons) {
            // 데미지 부스트 적용
            const originalDamage = weapon.damage;
            weapon.damage = Math.floor(originalDamage * this.damageBoostMultiplier);
            
            weapon.fire(this.position.x, this.position.y, enemies, projectiles, currentTime);
            
            // 원래 데미지로 복구
            weapon.damage = originalDamage;
        }
    }

    public applySpeedBoost(percentage: number, duration: number): void {
        this.speedBoostMultiplier = 1 + (percentage / 100);
        this.speedBoostDuration = duration;
        console.log(`💨 속도 증가! ${percentage}% 증가, ${duration/1000}초간`);
    }

    public applyDamageBoost(percentage: number, duration: number): void {
        this.damageBoostMultiplier = 1 + (percentage / 100);
        this.damageBoostDuration = duration;
        console.log(`⚔️ 데미지 증가! ${percentage}% 증가, ${duration/1000}초간`);
    }

    public hasActiveEffects(): boolean {
        return this.speedBoostDuration > 0 || this.damageBoostDuration > 0;
    }
}
