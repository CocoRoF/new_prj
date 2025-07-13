import { Vector2D, Player } from './Player';

/**
 * 아이템 타입 상수
 */
export const ItemType = {
  HEALTH: 'health',
  EXPERIENCE: 'experience',
  SPEED_BOOST: 'speed_boost',
  DAMAGE_BOOST: 'damage_boost',
  WEAPON_UPGRADE: 'weapon_upgrade'
} as const;

export type ItemTypeValue = typeof ItemType[keyof typeof ItemType];

/**
 * 아이템 베이스 클래스
 */
export abstract class Item {
  public position: Vector2D;
  public radius: number = 8;
  public color: string = '#ffffff';
  public glowColor: string = '#ffffff';
  public value: number;
  public type: ItemTypeValue;
  public lifeTime: number = 30000; // 30초 후 소멸
  public age: number = 0;
  public glowIntensity: number = 0;
  public bobOffset: number = 0;

  constructor(x: number, y: number, value: number, type: ItemTypeValue) {
    this.position = new Vector2D(x, y);
    this.value = value;
    this.type = type;
  }

  public update(deltaTime: number): void {
    this.age += deltaTime;
    
    // 반짝이는 효과
    this.glowIntensity = Math.sin(this.age * 0.005) * 0.5 + 0.5;
    
    // 위아래로 떠다니는 효과
    this.bobOffset = Math.sin(this.age * 0.003) * 3;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const renderY = this.position.y + this.bobOffset;
    
    // 글로우 효과
    const glowRadius = this.radius + 5 + this.glowIntensity * 3;
    const gradient = ctx.createRadialGradient(
      this.position.x, renderY, 0,
      this.position.x, renderY, glowRadius
    );
    gradient.addColorStop(0, this.glowColor + '80');
    gradient.addColorStop(1, this.glowColor + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, renderY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 아이템 본체
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, renderY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 아이템 타입별 심볼
    this.renderSymbol(ctx, this.position.x, renderY);
  }

  protected abstract renderSymbol(ctx: CanvasRenderingContext2D, x: number, y: number): void;

  public abstract apply(player: Player): void;

  public isAlive(): boolean {
    return this.age < this.lifeTime;
  }

  public isCollidingWith(player: Player): boolean {
    const distance = this.position.distance(player.position);
    return distance < (this.radius + player.radius);
  }
}

/**
 * 체력 회복 아이템
 */
export class HealthItem extends Item {
  constructor(x: number, y: number) {
    super(x, y, 30, ItemType.HEALTH);
    this.color = '#ff6b6b';
    this.glowColor = '#ff0000';
  }

  protected renderSymbol(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 십자가 모양
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 6, 4, 12);
    ctx.fillRect(x - 6, y - 2, 12, 4);
  }

  public apply(player: Player): void {
    player.currentHealth = Math.min(player.maxHealth, player.currentHealth + this.value);
    console.log(`❤️ 체력 회복! +${this.value} HP`);
  }
}

/**
 * 경험치 아이템
 */
export class ExperienceItem extends Item {
  constructor(x: number, y: number) {
    super(x, y, 50, ItemType.EXPERIENCE);
    this.color = '#ffff00';
    this.glowColor = '#ffaa00';
    this.radius = 6;
  }

  protected renderSymbol(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 별 모양
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y);
  }

  public apply(player: Player): void {
    player.gainExperience(this.value);
    console.log(`⭐ 경험치 획득! +${this.value} EXP`);
  }
}

/**
 * 속도 증가 아이템 (임시)
 */
export class SpeedBoostItem extends Item {
  constructor(x: number, y: number) {
    super(x, y, 50, ItemType.SPEED_BOOST); // 50% 속도 증가
    this.color = '#00ff00';
    this.glowColor = '#00aa00';
  }

  protected renderSymbol(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 화살표 모양
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 3);
    ctx.lineTo(x, y - 3);
    ctx.lineTo(x + 4, y + 3);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  public apply(_player: Player): void {
    // 임시 속도 증가 효과는 player에서 관리
    console.log(`💨 속도 증가! 10초간 +${this.value}% 속도`);
  }
}

/**
 * 데미지 증가 아이템 (임시)
 */
export class DamageBoostItem extends Item {
  constructor(x: number, y: number) {
    super(x, y, 30, ItemType.DAMAGE_BOOST); // 30% 데미지 증가
    this.color = '#ff8800';
    this.glowColor = '#ff4400';
  }

  protected renderSymbol(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 검 모양
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x - 3, y + 2);
    ctx.lineTo(x + 3, y + 2);
    ctx.stroke();
  }

  public apply(_player: Player): void {
    // 임시 데미지 증가 효과는 player에서 관리
    console.log(`⚔️ 데미지 증가! 15초간 +${this.value}% 데미지`);
  }
}

/**
 * 아이템 스포너
 */
export class ItemSpawner {
  private spawnTimer: number = 0;
  private spawnInterval: number = 8000; // 8초마다 아이템 스폰

  public update(deltaTime: number, items: Item[], enemies: any[], canvasWidth: number, canvasHeight: number): void {
    this.spawnTimer += deltaTime;

    if (this.spawnTimer >= this.spawnInterval) {
      // 적이 있을 때만 아이템 스폰
      if (enemies.length > 0) {
        this.spawnRandomItem(items, canvasWidth, canvasHeight);
      }
      this.spawnTimer = 0;
    }
  }

  private spawnRandomItem(items: Item[], canvasWidth: number, canvasHeight: number): void {
    // 랜덤 위치 (플레이어 근처가 아닌 곳)
    const x = Math.random() * (canvasWidth - 100) + 50;
    const y = Math.random() * (canvasHeight - 100) + 50;

    // 랜덤 아이템 타입 (확률 기반)
    const rand = Math.random();
    let item: Item;

    if (rand < 0.4) {
      item = new ExperienceItem(x, y);
    } else if (rand < 0.6) {
      item = new HealthItem(x, y);
    } else if (rand < 0.8) {
      item = new SpeedBoostItem(x, y);
    } else {
      item = new DamageBoostItem(x, y);
    }

    items.push(item);
    console.log(`🎁 아이템 스폰: ${item.type}`);
  }

  public spawnItemAtPosition(items: Item[], x: number, y: number, type?: ItemTypeValue): void {
    let item: Item;

    if (type) {
      switch (type) {
        case ItemType.HEALTH:
          item = new HealthItem(x, y);
          break;
        case ItemType.EXPERIENCE:
          item = new ExperienceItem(x, y);
          break;
        case ItemType.SPEED_BOOST:
          item = new SpeedBoostItem(x, y);
          break;
        case ItemType.DAMAGE_BOOST:
          item = new DamageBoostItem(x, y);
          break;
        default:
          item = new ExperienceItem(x, y);
      }
    } else {
      // 적 처치 시 드롭되는 아이템 (경험치 위주)
      const rand = Math.random();
      if (rand < 0.7) {
        item = new ExperienceItem(x, y);
      } else if (rand < 0.9) {
        item = new HealthItem(x, y);
      } else {
        item = Math.random() < 0.5 ? new SpeedBoostItem(x, y) : new DamageBoostItem(x, y);
      }
    }

    items.push(item);
  }
}
