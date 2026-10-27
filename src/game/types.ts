/**
 * Types and configurations for HD Battle Arena
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'PERK_SELECT' | 'GAME_OVER';

export type WeaponType = 'BLASTER' | 'SHOTGUN' | 'RAILGUN' | 'VULCAN' | 'MISSILE';

export interface WeaponConfig {
  name: string;
  type: WeaponType;
  color: string;
  fireRate: number; // shots per sec
  damage: number;
  bulletSpeed: number;
  bulletCount: number;
  spread: number; // in radians
  pierce: number;
  bulletRadius: number;
  description: string;
}

export type EnemyType = 'SWARMER' | 'BRUTE' | 'RANGER' | 'DISRUPTOR' | 'BOSS';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  angle: number;
  color: string;
  shootCooldown?: number;
  chargeCooldown?: number;
  isCharging?: boolean;
  chargeAngle?: number;
  hitFlashTimer?: number;
  shield?: number;
  maxShield?: number;
  bossPhase?: number;
}

export interface Bullet {
  id: number;
  isPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  life: number;
  maxLife: number;
  pierce: number;
  weaponType?: WeaponType;
  homing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export type PickupType = 'HEALTH' | 'WEAPON' | 'SHIELD' | 'NUKE' | 'OVERCHARGE' | 'GEM';

export interface Pickup {
  id: number;
  type: PickupType;
  weaponType?: WeaponType;
  x: number;
  y: number;
  radius: number;
  angle: number;
  life: number;
  pulseTimer: number;
}

export interface Perk {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  effect: (player: Player) => void;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  currentWeapon: WeaponType;
  weaponLevels: Record<WeaponType, number>;
  fireTimer: number;
  dashCooldown: number;
  dashMaxCooldown: number;
  dashDuration: number;
  dashActive: boolean;
  invulnerableTimer: number;
  score: number;
  kills: number;
  comboStreak: number;
  comboTimer: number;
  maxCombo: number;
  wave: number;
  droneActive: boolean;
  magnetRange: number;
  critChance: number;
  ghostTrails: Array<{ x: number; y: number; angle: number; alpha: number }>;
}

export interface GameHUDData {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  score: number;
  kills: number;
  wave: number;
  comboStreak: number;
  dashReady: boolean;
  dashProgress: number; // 0 to 1
  weaponName: string;
  weaponType: WeaponType;
  weaponLevel: number;
  bossHpPercent?: number | null;
  enemiesRemaining: number;
  state: GameState;
}
