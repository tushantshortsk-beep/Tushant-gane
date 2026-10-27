/**
 * HD Battle Arena - AAA Polished 60fps Canvas Game Engine
 * Handcrafted sci-fi interceptor ships, detailed mechanical enemies,
 * dynamic floor lighting, ambient arena embers, and tactile combat feedback.
 */

import { sounds } from './audio';
import {
  Bullet,
  Enemy,
  FloatingText,
  GameHUDData,
  GameState,
  Particle,
  Pickup,
  PickupType,
  Player,
  WeaponConfig,
  WeaponType,
} from './types';

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  BLASTER: {
    name: 'Pulse Blaster',
    type: 'BLASTER',
    color: '#00f0ff',
    fireRate: 5.8,
    damage: 30,
    bulletSpeed: 750,
    bulletCount: 1,
    spread: 0.04,
    pierce: 1,
    bulletRadius: 4.5,
    description: 'High-speed twin plasma bolts with balanced recoil and thermal stability.',
  },
  SHOTGUN: {
    name: 'Scatter Cannon',
    type: 'SHOTGUN',
    color: '#ff9900',
    fireRate: 2.4,
    damage: 24,
    bulletSpeed: 640,
    bulletCount: 6,
    spread: 0.36,
    pierce: 1,
    bulletRadius: 4,
    description: 'Fires high-density kinetic pellets with devastating point-blank stopping power.',
  },
  RAILGUN: {
    name: 'Hyper Railgun',
    type: 'RAILGUN',
    color: '#10b981',
    fireRate: 1.8,
    damage: 95,
    bulletSpeed: 1200,
    bulletCount: 1,
    spread: 0.01,
    pierce: 7,
    bulletRadius: 6,
    description: 'Piercing relativistic energy beam punching through entire ranks of enemies.',
  },
  VULCAN: {
    name: 'Gatling Vulcan',
    type: 'VULCAN',
    color: '#eab308',
    fireRate: 12,
    damage: 18,
    bulletSpeed: 820,
    bulletCount: 1,
    spread: 0.11,
    pierce: 1,
    bulletRadius: 3.5,
    description: 'Rapid-fire cyclic rotary cannon overwhelming targets in sustained suppression.',
  },
  MISSILE: {
    name: 'Micro Missiles',
    type: 'MISSILE',
    color: '#f43f5e',
    fireRate: 2.8,
    damage: 60,
    bulletSpeed: 500,
    bulletCount: 2,
    spread: 0.22,
    pierce: 1,
    bulletRadius: 5.5,
    description: 'Smart swarm micro-rockets that auto-acquire targets with proximity fragmentation.',
  },
};

interface AmbientEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHUDUpdate: (data: GameHUDData) => void;
  private onStateChange: (state: GameState) => void;
  private onWaveComplete?: (wave: number) => void;

  public state: GameState = 'TITLE';

  // Dimensions
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;
  public dpr: number = Math.min(window.devicePixelRatio || 1, 2);

  // Entities
  public player!: Player;
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public particles: Particle[] = [];
  public pickups: Pickup[] = [];
  public floatingTexts: FloatingText[] = [];

  // Wave system
  public wave: number = 1;
  public waveSpawnBudget: number = 0;
  public waveTotalEnemies: number = 0;
  public waveEnemiesSpawned: number = 0;
  public waveSpawnTimer: number = 0;
  public bossAlive: boolean = false;
  public bossHpPercent: number | null = null;

  // Camera, Hitstop & Screen Shake
  public cameraShake: number = 0;
  public screenShakeEnabled: boolean = true;
  private cameraOffsetX: number = 0;
  private cameraOffsetY: number = 0;
  public hitstopTimer: number = 0;
  private nextEntityId: number = 1;

  // Gun recoil kickback
  private gunRecoil: number = 0;

  // Loop & Time
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private isDestroyed: boolean = false;

  // Input state
  public keys: Record<string, boolean> = {};
  public mouseX: number = window.innerWidth / 2;
  public mouseY: number = window.innerHeight / 2;
  public isMouseDown: boolean = false;
  public usingMouseAim: boolean = false;
  public virtualJoyX: number = 0;
  public virtualJoyY: number = 0;
  public virtualFire: boolean = false;
  public autoFire: boolean = false;

  // Ambient atmosphere
  private gridOffset: number = 0;
  private embers: AmbientEmber[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    onHUDUpdate: (data: GameHUDData) => void,
    onStateChange: (state: GameState) => void,
    onWaveComplete?: (wave: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.onHUDUpdate = onHUDUpdate;
    this.onStateChange = onStateChange;
    this.onWaveComplete = onWaveComplete;

    this.resize();
    this.initPlayer();
    this.initEmbers();
    this.setupListeners();
    this.startLoop();
  }

  private initEmbers() {
    this.embers = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.embers.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 18,
        vy: -15 - Math.random() * 25,
        size: 1.5 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.45,
        color: Math.random() > 0.5 ? '#00f0ff' : '#f59e0b',
      });
    }
  }

  public resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
  }

  private initPlayer() {
    this.player = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      radius: 19,
      angle: 0,
      hp: 100,
      maxHp: 100,
      shield: 35,
      maxShield: 35,
      speed: 270,
      currentWeapon: 'BLASTER',
      weaponLevels: {
        BLASTER: 1,
        SHOTGUN: 1,
        RAILGUN: 1,
        VULCAN: 1,
        MISSILE: 1,
      },
      fireTimer: 0,
      dashCooldown: 0,
      dashMaxCooldown: 1.7,
      dashDuration: 0,
      dashActive: false,
      invulnerableTimer: 0,
      score: 0,
      kills: 0,
      comboStreak: 0,
      comboTimer: 0,
      maxCombo: 0,
      wave: 1,
      droneActive: false,
      magnetRange: 200,
      critChance: 0.12,
      ghostTrails: [],
    };
  }

  public startGame() {
    this.initPlayer();
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.wave = 1;
    this.bossAlive = false;
    this.bossHpPercent = null;
    this.prepareWave(1);

    this.state = 'PLAYING';
    this.onStateChange(this.state);
    sounds.playWaveStart();
    this.spawnFloatingText('SECTOR ENGAGED: WAVE 1', this.width / 2, this.height / 2 - 60, '#00f0ff', 24);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.onStateChange(this.state);
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTimestamp = performance.now();
      this.onStateChange(this.state);
    }
  }

  public applyPerk(id: string) {
    if (!this.player) return;
    if (id === 'SHIELD_BOOST') {
      this.player.maxShield += 30;
      this.player.shield = this.player.maxShield;
      this.spawnFloatingText('+30 SHIELD CAPACITY', this.player.x, this.player.y - 20, '#00f0ff', 18);
    } else if (id === 'SPEED_BOOST') {
      this.player.speed += 40;
      this.player.dashMaxCooldown = Math.max(0.8, this.player.dashMaxCooldown - 0.3);
      this.spawnFloatingText('+TURBO ENGINES', this.player.x, this.player.y - 20, '#10b981', 18);
    } else if (id === 'WEAPON_DAMAGE') {
      const cur = this.player.currentWeapon;
      this.player.weaponLevels[cur] = (this.player.weaponLevels[cur] || 1) + 1;
      this.spawnFloatingText(`${cur} OVERCLOCKED Lvl ${this.player.weaponLevels[cur]}`, this.player.x, this.player.y - 20, '#f59e0b', 18);
    } else if (id === 'COMBAT_DRONE') {
      this.player.droneActive = true;
      this.spawnFloatingText('ORBITAL DEFENSE DRONE ONLINE', this.player.x, this.player.y - 20, '#ec4899', 18);
    } else if (id === 'NANITE_REPAIR') {
      this.player.maxHp += 25;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
      this.spawnFloatingText('+HP & NANO REPAIR', this.player.x, this.player.y - 20, '#22c55e', 18);
    } else if (id === 'CRIT_SURGE') {
      this.player.critChance += 0.15;
      this.spawnFloatingText('+CRITICAL CHANCE SURGE', this.player.x, this.player.y - 20, '#f43f5e', 18);
    }

    sounds.playPowerup();
    this.state = 'PLAYING';
    this.lastTimestamp = performance.now();
    this.onStateChange(this.state);
  }

  public switchWeapon(type: WeaponType) {
    this.player.currentWeapon = type;
    sounds.playPowerup();
    this.spawnFloatingText(`EQUIPPED: ${WEAPONS[type].name}`, this.player.x, this.player.y - 30, WEAPONS[type].color, 18);
  }

  public triggerDash() {
    if (this.player.dashCooldown > 0 || this.state !== 'PLAYING') return;

    this.player.dashCooldown = this.player.dashMaxCooldown;
    this.player.dashDuration = 0.22;
    this.player.dashActive = true;
    this.player.invulnerableTimer = 0.3;
    sounds.playDash();

    // Dash burst shockwave particles
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 120 + Math.random() * 240;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        radius: 3.5 + Math.random() * 3,
        color: '#00f0ff',
        life: 0.35,
        maxLife: 0.35,
        alpha: 1,
      });
    }
  }

  private prepareWave(waveNum: number) {
    this.wave = waveNum;
    this.player.wave = waveNum;
    const isBossWave = waveNum % 5 === 0;

    if (isBossWave) {
      this.waveSpawnBudget = 10;
      this.waveTotalEnemies = 1 + waveNum * 2;
      this.bossAlive = true;
      this.bossHpPercent = 1;
      this.spawnBoss(waveNum);
    } else {
      this.waveSpawnBudget = 10 + waveNum * 5;
      this.waveTotalEnemies = this.waveSpawnBudget;
      this.bossAlive = false;
      this.bossHpPercent = null;
    }
    this.waveEnemiesSpawned = 0;
    this.waveSpawnTimer = 0;
  }

  private spawnBoss(waveNum: number) {
    sounds.playBossAlarm();
    const hp = 900 + waveNum * 350;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'BOSS',
      x: this.width / 2,
      y: 90,
      vx: 0,
      vy: 0,
      radius: 46,
      hp: hp,
      maxHp: hp,
      speed: 65 + waveNum * 4,
      angle: Math.PI / 2,
      color: '#ef4444',
      shootCooldown: 1.2,
      chargeCooldown: 4.5,
      hitFlashTimer: 0,
      bossPhase: 1,
    });
    this.spawnFloatingText('WARNING: GOLIATH MECH TITAN INCOMING', this.width / 2, this.height / 2 - 90, '#ef4444', 22);
  }

  private spawnEnemy() {
    if (this.waveEnemiesSpawned >= this.waveTotalEnemies && !this.bossAlive) return;

    const margin = 40;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = -margin;
      y = Math.random() * this.height;
    } else if (side === 1) {
      x = this.width + margin;
      y = Math.random() * this.height;
    } else if (side === 2) {
      x = Math.random() * this.width;
      y = -margin;
    } else {
      x = Math.random() * this.width;
      y = this.height + margin;
    }

    // Spawn warp portal particles at arena edge
    const beaconX = Math.max(16, Math.min(this.width - 16, x));
    const beaconY = Math.max(16, Math.min(this.height - 16, y));
    for (let p = 0; p < 5; p++) {
      this.particles.push({
        x: beaconX,
        y: beaconY,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        radius: 3,
        color: '#f43f5e',
        life: 0.35,
        maxLife: 0.35,
        alpha: 1,
      });
    }

    const roll = Math.random();
    let type: 'SWARMER' | 'BRUTE' | 'RANGER' | 'DISRUPTOR' = 'SWARMER';

    if (this.wave >= 2 && roll < 0.25) {
      type = 'RANGER';
    } else if (this.wave >= 3 && roll >= 0.25 && roll < 0.5) {
      type = 'BRUTE';
    } else if (this.wave >= 4 && roll >= 0.5 && roll < 0.72) {
      type = 'DISRUPTOR';
    }

    if (type === 'SWARMER') {
      const hp = 22 + this.wave * 4;
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'SWARMER',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 15,
        hp,
        maxHp: hp,
        speed: 130 + Math.random() * 35 + this.wave * 3,
        angle: 0,
        color: '#f43f5e',
        hitFlashTimer: 0,
      });
    } else if (type === 'BRUTE') {
      const hp = 75 + this.wave * 15;
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'BRUTE',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 24,
        hp,
        maxHp: hp,
        speed: 75 + Math.random() * 20,
        angle: 0,
        color: '#f97316',
        chargeCooldown: 3.0,
        isCharging: false,
        hitFlashTimer: 0,
      });
    } else if (type === 'RANGER') {
      const hp = 40 + this.wave * 6;
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'RANGER',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 17,
        hp,
        maxHp: hp,
        speed: 100,
        angle: 0,
        color: '#a855f7',
        shootCooldown: 1.5 + Math.random() * 0.8,
        hitFlashTimer: 0,
      });
    } else if (type === 'DISRUPTOR') {
      const hp = 50 + this.wave * 8;
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'DISRUPTOR',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp,
        maxHp: hp,
        speed: 115,
        angle: 0,
        color: '#06b6d4',
        chargeCooldown: 2.2,
        hitFlashTimer: 0,
      });
    }

    this.waveEnemiesSpawned++;
  }

  private shootPlayerWeapon() {
    const config = WEAPONS[this.player.currentWeapon];
    const level = this.player.weaponLevels[this.player.currentWeapon] || 1;
    const damageMultiplier = 1 + (level - 1) * 0.25;

    sounds.playShoot(this.player.currentWeapon);
    if (config.type === 'RAILGUN') {
      this.addCameraShake(0.5);
    }
    this.gunRecoil = 5;

    // Dual muzzle flash particles
    const tipX = this.player.x + Math.cos(this.player.angle) * 24;
    const tipY = this.player.y + Math.sin(this.player.angle) * 24;
    this.particles.push({
      x: tipX,
      y: tipY,
      vx: Math.cos(this.player.angle) * 60,
      vy: Math.sin(this.player.angle) * 60,
      radius: 9,
      color: config.color,
      life: 0.08,
      maxLife: 0.08,
      alpha: 1,
    });

    const isCrit = Math.random() < this.player.critChance;
    const finalDamage = Math.round(config.damage * damageMultiplier * (isCrit ? 1.8 : 1));

    if (config.type === 'SHOTGUN') {
      const count = config.bulletCount + (level >= 3 ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const spreadAngle = this.player.angle + (Math.random() - 0.5) * config.spread;
        const speed = config.bulletSpeed * (0.9 + Math.random() * 0.2);
        this.bullets.push({
          id: this.nextEntityId++,
          isPlayer: true,
          x: tipX,
          y: tipY,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          radius: config.bulletRadius,
          color: config.color,
          damage: finalDamage,
          life: 0.65,
          maxLife: 0.65,
          pierce: 1,
          weaponType: 'SHOTGUN',
        });
      }
    } else if (config.type === 'RAILGUN') {
      this.bullets.push({
        id: this.nextEntityId++,
        isPlayer: true,
        x: tipX,
        y: tipY,
        vx: Math.cos(this.player.angle) * config.bulletSpeed,
        vy: Math.sin(this.player.angle) * config.bulletSpeed,
        radius: config.bulletRadius + level,
        color: config.color,
        damage: finalDamage,
        life: 1.2,
        maxLife: 1.2,
        pierce: config.pierce + level,
        weaponType: 'RAILGUN',
      });
    } else if (config.type === 'MISSILE') {
      const count = level >= 2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const offsetAngle = this.player.angle + ((i - (count - 1) / 2) * 0.35);
        this.bullets.push({
          id: this.nextEntityId++,
          isPlayer: true,
          x: tipX,
          y: tipY,
          vx: Math.cos(offsetAngle) * config.bulletSpeed * 0.8,
          vy: Math.sin(offsetAngle) * config.bulletSpeed * 0.8,
          radius: config.bulletRadius,
          color: config.color,
          damage: finalDamage,
          life: 2.2,
          maxLife: 2.2,
          pierce: 1,
          weaponType: 'MISSILE',
          homing: true,
        });
      }
    } else {
      // BLASTER or VULCAN
      const spreadAngle = this.player.angle + (Math.random() - 0.5) * config.spread;
      this.bullets.push({
        id: this.nextEntityId++,
        isPlayer: true,
        x: tipX,
        y: tipY,
        vx: Math.cos(spreadAngle) * config.bulletSpeed,
        vy: Math.sin(spreadAngle) * config.bulletSpeed,
        radius: config.bulletRadius,
        color: config.color,
        damage: finalDamage,
        life: 1.2,
        maxLife: 1.2,
        pierce: config.pierce,
        weaponType: config.type,
      });

      // Dual blaster level 2+
      if (config.type === 'BLASTER' && level >= 2) {
        const normalX = -Math.sin(this.player.angle) * 10;
        const normalY = Math.cos(this.player.angle) * 10;
        this.bullets.push({
          id: this.nextEntityId++,
          isPlayer: true,
          x: tipX + normalX,
          y: tipY + normalY,
          vx: Math.cos(spreadAngle) * config.bulletSpeed,
          vy: Math.sin(spreadAngle) * config.bulletSpeed,
          radius: config.bulletRadius,
          color: config.color,
          damage: finalDamage,
          life: 1.2,
          maxLife: 1.2,
          pierce: config.pierce,
          weaponType: config.type,
        });
      }
    }
  }

  public addCameraShake(amount: number) {
    if (!this.screenShakeEnabled) return;
    this.cameraShake = Math.min(3.0, this.cameraShake + amount);
  }

  public spawnFloatingText(text: string, x: number, y: number, color: string = '#ffffff', size: number = 16) {
    this.floatingTexts.push({
      id: this.nextEntityId++,
      text,
      x,
      y,
      vy: -48,
      color,
      size,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  private dropPickup(x: number, y: number) {
    const roll = Math.random();
    let type: PickupType = 'GEM';

    if (roll < 0.14) {
      type = 'HEALTH';
    } else if (roll < 0.25) {
      type = 'SHIELD';
    } else if (roll < 0.36) {
      type = 'WEAPON';
    } else if (roll < 0.42) {
      type = 'OVERCHARGE';
    } else if (roll < 0.47 && this.enemies.length > 5) {
      type = 'NUKE';
    }

    const availableWeapons: WeaponType[] = ['SHOTGUN', 'RAILGUN', 'VULCAN', 'MISSILE', 'BLASTER'];
    const chosenWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];

    this.pickups.push({
      id: this.nextEntityId++,
      type,
      weaponType: type === 'WEAPON' ? chosenWeapon : undefined,
      x,
      y,
      radius: 13,
      angle: 0,
      life: 18,
      pulseTimer: 0,
    });
  }

  private triggerNuke() {
    this.addCameraShake(18);
    sounds.playExplosion(true);
    this.spawnFloatingText('TACTICAL EMP DETONATED!', this.width / 2, this.height / 2, '#38bdf8', 26);

    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        radius: 6,
        color: '#38bdf8',
        life: 0.7,
        maxLife: 0.7,
        alpha: 1,
      });
    }

    for (const enemy of this.enemies) {
      enemy.hp -= 220;
      enemy.hitFlashTimer = 0.2;
    }
  }

  private checkWaveCompletion() {
    if (this.enemies.length === 0 && this.waveEnemiesSpawned >= this.waveTotalEnemies && !this.bossAlive) {
      sounds.playPowerup();
      this.player.score += this.wave * 120;
      this.spawnFloatingText(`WAVE ${this.wave} PURGED!`, this.width / 2, this.height / 2 - 40, '#10b981', 26);

      if (this.wave % 2 === 0) {
        this.state = 'PERK_SELECT';
        this.onStateChange(this.state);
        this.prepareWave(this.wave + 1);
        if (this.onWaveComplete) {
          this.onWaveComplete(this.wave);
        }
      } else {
        this.prepareWave(this.wave + 1);
      }
    }
  }

  private update(dt: number, now: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Camera shake decay & temporary offset variables (gentle and lag-free)
    if (this.cameraShake > 0 && this.screenShakeEnabled) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 15);
      this.cameraOffsetX = (Math.random() - 0.5) * this.cameraShake * 0.7;
      this.cameraOffsetY = (Math.random() - 0.5) * this.cameraShake * 0.7;
    } else {
      this.cameraShake = 0;
      this.cameraOffsetX = 0;
      this.cameraOffsetY = 0;
    }

    if (this.gunRecoil > 0) {
      this.gunRecoil = Math.max(0, this.gunRecoil - dt * 35);
    }

    // Floating text updates
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Particle updates
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Ambient embers drifting
    for (const ember of this.embers) {
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;
      if (ember.y < -10) {
        ember.y = this.height + 10;
        ember.x = Math.random() * this.width;
      }
      if (ember.x < -10) ember.x = this.width + 10;
      if (ember.x > this.width + 10) ember.x = -10;
    }

    if (this.state === 'TITLE') {
      this.gridOffset = (this.gridOffset + dt * 20) % 50;
      return;
    }

    if (this.state !== 'PLAYING') return;

    this.gridOffset = (this.gridOffset + dt * 25) % 50;

    // Movement calculation
    let moveX = 0;
    let moveY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    moveX += this.virtualJoyX;
    moveY += this.virtualJoyY;

    const moveMag = Math.hypot(moveX, moveY);
    const isMoving = moveMag > 0.05;

    if (isMoving) {
      const norm = Math.min(1, moveMag);
      const angle = Math.atan2(moveY, moveX);
      const curSpeed = this.player.dashActive ? this.player.speed * 2.8 : this.player.speed;
      this.player.vx = Math.cos(angle) * curSpeed * norm;
      this.player.vy = Math.sin(angle) * curSpeed * norm;

      // Thruster exhaust spark particles
      if (Math.random() < 0.45) {
        const revAngle = this.player.angle + Math.PI;
        this.particles.push({
          x: this.player.x + Math.cos(revAngle) * 16 + (Math.random() - 0.5) * 8,
          y: this.player.y + Math.sin(revAngle) * 16 + (Math.random() - 0.5) * 8,
          vx: Math.cos(revAngle) * (80 + Math.random() * 60),
          vy: Math.sin(revAngle) * (80 + Math.random() * 60),
          radius: 2.5,
          color: Math.random() > 0.3 ? '#00f0ff' : '#f97316',
          life: 0.18,
          maxLife: 0.18,
          alpha: 1,
        });
      }
    } else {
      this.player.vx *= 0.82;
      this.player.vy *= 0.82;
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Arena boundary clamp
    const boundMargin = 24;
    this.player.x = Math.max(boundMargin, Math.min(this.width - boundMargin, this.player.x));
    this.player.y = Math.max(boundMargin, Math.min(this.height - boundMargin, this.player.y));

    // Dash updates
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    }
    if (this.player.dashDuration > 0) {
      this.player.dashDuration -= dt;
      this.player.ghostTrails.push({
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle,
        alpha: 0.65,
      });
      if (this.player.dashDuration <= 0) {
        this.player.dashActive = false;
      }
    }

    // Fade ghost trails
    for (let i = this.player.ghostTrails.length - 1; i >= 0; i--) {
      this.player.ghostTrails[i].alpha -= dt * 3.8;
      if (this.player.ghostTrails[i].alpha <= 0) {
        this.player.ghostTrails.splice(i, 1);
      }
    }

    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer = Math.max(0, this.player.invulnerableTimer - dt);
    }

    // Shield passive regeneration
    if (this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + dt * 4.5);
    }

    // Combo streak decay
    if (this.player.comboStreak > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.comboStreak = 0;
      }
    }

    // Aiming calculation
    let nearestEnemy: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = e;
      }
    }

    if (this.usingMouseAim) {
      this.player.angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
    } else if (nearestEnemy) {
      this.player.angle = Math.atan2(nearestEnemy.y - this.player.y, nearestEnemy.x - this.player.x);
    }

    // Weapon firing
    const config = WEAPONS[this.player.currentWeapon];
    this.player.fireTimer += dt;
    const fireInterval = 1 / config.fireRate;

    const wantsToFire = this.isMouseDown || this.virtualFire || this.keys['Space'] || this.autoFire;
    if (wantsToFire && this.player.fireTimer >= fireInterval) {
      this.shootPlayerWeapon();
      this.player.fireTimer = 0;
    }

    // Enemy Spawner Logic
    this.waveSpawnTimer += dt;
    const spawnRate = Math.max(0.38, 1.35 - this.wave * 0.08);
    if (this.waveSpawnTimer >= spawnRate && this.waveEnemiesSpawned < this.waveTotalEnemies) {
      this.spawnEnemy();
      this.waveSpawnTimer = 0;
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= dt;
      }

      const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      const angleToPlayer = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.angle = angleToPlayer;

      if (enemy.type === 'SWARMER') {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * dt;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * dt;
      } else if (enemy.type === 'BRUTE') {
        if (!enemy.isCharging) {
          enemy.x += Math.cos(angleToPlayer) * enemy.speed * dt;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed * dt;
          if (enemy.chargeCooldown !== undefined) {
            enemy.chargeCooldown -= dt;
            if (enemy.chargeCooldown <= 0 && distToPlayer < 340) {
              enemy.isCharging = true;
              enemy.chargeAngle = angleToPlayer;
              enemy.chargeCooldown = 2.8;
            }
          }
        } else {
          const chargeAngle = enemy.chargeAngle ?? angleToPlayer;
          enemy.x += Math.cos(chargeAngle) * enemy.speed * 3.3 * dt;
          enemy.y += Math.sin(chargeAngle) * enemy.speed * 3.3 * dt;
          if (enemy.chargeCooldown !== undefined) {
            enemy.chargeCooldown -= dt;
            if (enemy.chargeCooldown <= 2.2) {
              enemy.isCharging = false;
            }
          }
        }
      } else if (enemy.type === 'RANGER') {
        if (distToPlayer < 220) {
          enemy.x -= Math.cos(angleToPlayer) * enemy.speed * dt;
          enemy.y -= Math.sin(angleToPlayer) * enemy.speed * dt;
        } else if (distToPlayer > 320) {
          enemy.x += Math.cos(angleToPlayer) * enemy.speed * dt;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed * dt;
        }

        if (enemy.shootCooldown !== undefined) {
          enemy.shootCooldown -= dt;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 1.9;
            this.bullets.push({
              id: this.nextEntityId++,
              isPlayer: false,
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angleToPlayer) * 330,
              vy: Math.sin(angleToPlayer) * 330,
              radius: 5,
              color: '#c084fc',
              damage: 18,
              life: 2.6,
              maxLife: 2.6,
              pierce: 1,
            });
          }
        }
      } else if (enemy.type === 'DISRUPTOR') {
        const orbitAngle = angleToPlayer + Math.PI / 2;
        enemy.x += Math.cos(orbitAngle) * enemy.speed * dt + Math.cos(angleToPlayer) * 45 * dt;
        enemy.y += Math.sin(orbitAngle) * enemy.speed * dt + Math.sin(angleToPlayer) * 45 * dt;
      } else if (enemy.type === 'BOSS') {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * dt;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * dt;
        this.bossHpPercent = Math.max(0, enemy.hp / enemy.maxHp);

        if (enemy.shootCooldown !== undefined) {
          enemy.shootCooldown -= dt;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 1.35;
            for (let b = -2; b <= 2; b++) {
              const spread = angleToPlayer + b * 0.22;
              this.bullets.push({
                id: this.nextEntityId++,
                isPlayer: false,
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(spread) * 320,
                vy: Math.sin(spread) * 320,
                radius: 6.5,
                color: '#ef4444',
                damage: 24,
                life: 3.0,
                maxLife: 3.0,
                pierce: 1,
              });
            }
          }
        }
      }

      if (distToPlayer < enemy.radius + this.player.radius && !this.player.dashActive) {
        if (this.player.invulnerableTimer <= 0) {
          this.damagePlayer(enemy.type === 'BOSS' ? 32 : 16);
        }
      }

      if (enemy.hp <= 0) {
        this.killEnemy(enemy, i);
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      if (b.homing && b.isPlayer && nearestEnemy) {
        const targetAngle = Math.atan2(nearestEnemy.y - b.y, nearestEnemy.x - b.x);
        const curAngle = Math.atan2(b.vy, b.vx);
        let diff = targetAngle - curAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const turnRate = 4.8 * dt;
        const newAngle = curAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
        const speed = Math.hypot(b.vx, b.vy);
        b.vx = Math.cos(newAngle) * speed;
        b.vy = Math.sin(newAngle) * speed;

        if (Math.random() < 0.65) {
          this.particles.push({
            x: b.x,
            y: b.y,
            vx: -b.vx * 0.1 + (Math.random() - 0.5) * 20,
            vy: -b.vy * 0.1 + (Math.random() - 0.5) * 20,
            radius: 3,
            color: '#fdba74',
            life: 0.25,
            maxLife: 0.25,
            alpha: 0.8,
          });
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      let removeBullet = false;

      if (b.isPlayer) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.radius + b.radius) {
            e.hp -= b.damage;
            e.hitFlashTimer = 0.1;
            sounds.playHit();
            if (e.type === 'BOSS') {
              this.addCameraShake(0.6);
            } else if (b.weaponType === 'RAILGUN') {
              this.addCameraShake(0.3);
            }

            this.spawnFloatingText(`${b.damage}`, e.x + (Math.random() - 0.5) * 16, e.y - 12, b.color, 14);

            for (let s = 0; s < 5; s++) {
              const a = Math.random() * Math.PI * 2;
              this.particles.push({
                x: b.x,
                y: b.y,
                vx: Math.cos(a) * (90 + Math.random() * 120),
                vy: Math.sin(a) * (90 + Math.random() * 120),
                radius: 2.5,
                color: b.color,
                life: 0.2,
                maxLife: 0.2,
                alpha: 1,
              });
            }

            b.pierce--;
            if (b.pierce <= 0) {
              removeBullet = true;
              break;
            }
          }
        }
      } else {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist < this.player.radius + b.radius) {
          if (!this.player.dashActive && this.player.invulnerableTimer <= 0) {
            this.damagePlayer(b.damage);
            removeBullet = true;
          }
        }
      }

      if (
        removeBullet ||
        b.life <= 0 ||
        b.x < -30 ||
        b.x > this.width + 30 ||
        b.y < -30 ||
        b.y > this.height + 30
      ) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;
      p.pulseTimer += dt * 4;

      const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (dist < this.player.magnetRange) {
        const a = Math.atan2(this.player.y - p.y, this.player.x - p.x);
        p.x += Math.cos(a) * 400 * dt;
        p.y += Math.sin(a) * 400 * dt;
      }

      if (dist < this.player.radius + p.radius) {
        this.collectPickup(p);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.pickups.splice(i, 1);
      }
    }

    this.checkWaveCompletion();

    if (this.player.hp <= 0) {
      this.handleGameOver();
    }

    this.onHUDUpdate({
      hp: Math.max(0, Math.ceil(this.player.hp)),
      maxHp: this.player.maxHp,
      shield: Math.max(0, Math.ceil(this.player.shield)),
      maxShield: this.player.maxShield,
      score: this.player.score,
      kills: this.player.kills,
      wave: this.wave,
      comboStreak: this.player.comboStreak,
      dashReady: this.player.dashCooldown <= 0,
      dashProgress: 1 - this.player.dashCooldown / this.player.dashMaxCooldown,
      weaponName: WEAPONS[this.player.currentWeapon].name,
      weaponType: this.player.currentWeapon,
      weaponLevel: this.player.weaponLevels[this.player.currentWeapon] || 1,
      bossHpPercent: this.bossAlive ? this.bossHpPercent : null,
      enemiesRemaining: Math.max(0, this.waveTotalEnemies - this.waveEnemiesSpawned + this.enemies.length),
      state: this.state,
    });
  }

  private damagePlayer(amount: number) {
    this.addCameraShake(1.8);
    sounds.playPlayerHurt();
    this.player.invulnerableTimer = 0.4;

    if (this.player.shield > 0) {
      const shieldAbsorb = Math.min(this.player.shield, amount);
      this.player.shield -= shieldAbsorb;
      amount -= shieldAbsorb;
      this.spawnFloatingText(`-${Math.round(shieldAbsorb)} SHIELD`, this.player.x, this.player.y - 20, '#38bdf8', 14);
    }

    if (amount > 0) {
      this.player.hp = Math.max(0, this.player.hp - amount);
      this.spawnFloatingText(`-${Math.round(amount)} HP`, this.player.x, this.player.y - 12, '#ef4444', 16);
    }
  }

  private killEnemy(enemy: Enemy, index: number) {
    const isBoss = enemy.type === 'BOSS';
    sounds.playExplosion(isBoss);
    this.addCameraShake(isBoss ? 1.5 : 0.2);

    if (isBoss) {
      this.hitstopTimer = 0.06;
      this.bossAlive = false;
      this.bossHpPercent = null;
      this.player.score += 1500;
      this.spawnFloatingText('+1500 BOSS DOWN!', enemy.x, enemy.y, '#ffd700', 26);
    } else {
      this.player.score += 25 * (1 + this.player.comboStreak * 0.1);
    }

    this.player.kills++;
    this.player.comboStreak++;
    this.player.comboTimer = 2.4;
    if (this.player.comboStreak > this.player.maxCombo) {
      this.player.maxCombo = this.player.comboStreak;
    }

    if (this.player.comboStreak % 5 === 0 && this.player.comboStreak >= 5) {
      this.spawnFloatingText(`${this.player.comboStreak}x KILL STREAK!`, this.player.x, this.player.y - 40, '#f59e0b', 20);
    }

    // Death explosion particles
    const particleCount = isBoss ? 48 : 14;
    for (let p = 0; p < particleCount; p++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * (isBoss ? 280 : 160);
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        radius: 3 + Math.random() * 4,
        color: enemy.color,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        alpha: 1,
      });
    }

    this.dropPickup(enemy.x, enemy.y);
    this.enemies.splice(index, 1);
  }

  private collectPickup(p: Pickup) {
    sounds.playPowerup();
    if (p.type === 'HEALTH') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.spawnFloatingText('+35 NANO HP', this.player.x, this.player.y - 20, '#22c55e', 16);
    } else if (p.type === 'SHIELD') {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 40);
      this.spawnFloatingText('+40 SHIELD MATRIX', this.player.x, this.player.y - 20, '#38bdf8', 16);
    } else if (p.type === 'WEAPON' && p.weaponType) {
      this.switchWeapon(p.weaponType);
    } else if (p.type === 'NUKE') {
      this.triggerNuke();
    } else if (p.type === 'OVERCHARGE') {
      this.player.fireTimer = 10;
      this.spawnFloatingText('OVERCHARGE TRIGGERED!', this.player.x, this.player.y - 20, '#eab308', 18);
    } else if (p.type === 'GEM') {
      this.player.score += 50;
      this.spawnFloatingText('+50 PTS', p.x, p.y, '#e0e7ff', 13);
    }
  }

  private handleGameOver() {
    this.state = 'GAME_OVER';
    sounds.playGameOver();
    this.onStateChange(this.state);
  }

  private draw() {
    this.ctx.save();

    // Camera Shake translation using temporary offset variables
    if (this.cameraShake > 0) {
      this.ctx.translate(this.cameraOffsetX, this.cameraOffsetY);
    }

    // 1. Deep sci-fi metallic arena background
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. High-tech floor tiles with subtle bevels
    const tileSize = 60;
    const offsetX = this.gridOffset % tileSize;
    const offsetY = this.gridOffset % tileSize;

    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(30, 58, 138, 0.2)';
    this.ctx.beginPath();
    for (let x = -tileSize + offsetX; x <= this.width + tileSize; x += tileSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    for (let y = -tileSize + offsetY; y <= this.height + tileSize; y += tileSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();

    // 3. Perimeter Boundary & Hazard Caution Chevrons
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    this.ctx.strokeRect(8, 8, this.width - 16, this.height - 16);

    // 4. Ambient floating embers
    for (const ember of this.embers) {
      this.ctx.fillStyle = ember.color;
      this.ctx.globalAlpha = ember.alpha;
      this.ctx.beginPath();
      this.ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    // 5. Draw Pickups (with 3D-feeling shadow and floating pulse)
    for (const p of this.pickups) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      const pulseScale = 1 + Math.sin(p.pulseTimer) * 0.15;
      this.ctx.scale(pulseScale, pulseScale);

      let color = '#38bdf8';
      let symbol = '+';
      if (p.type === 'HEALTH') {
        color = '#22c55e';
        symbol = 'HP';
      } else if (p.type === 'SHIELD') {
        color = '#38bdf8';
        symbol = 'SH';
      } else if (p.type === 'WEAPON') {
        color = '#f59e0b';
        symbol = 'WPN';
      } else if (p.type === 'NUKE') {
        color = '#ef4444';
        symbol = 'EMP';
      } else if (p.type === 'OVERCHARGE') {
        color = '#eab308';
        symbol = '⚡';
      } else {
        color = '#a855f7';
        symbol = '◆';
      }

      // Outer glow ring
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner insignia
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 9px "JetBrains Mono", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(symbol, 0, 1);

      this.ctx.restore();
    }

    // 6. Draw Bullets
    for (const b of this.bullets) {
      this.ctx.save();
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner white hot core
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 7. Draw Enemies with distinct, rich mechanical silhouettes
    for (const e of this.enemies) {
      this.ctx.save();
      this.ctx.translate(e.x, e.y);

      // Charge telegraph indicator line for brutes
      if (e.isCharging && e.chargeAngle !== undefined) {
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
        this.ctx.lineWidth = 3.5;
        this.ctx.setLineDash([8, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(e.chargeAngle - e.angle) * 180, Math.sin(e.chargeAngle - e.angle) * 180);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // Sniper aim laser sight
      if (e.type === 'RANGER') {
        this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(0) * 180, Math.sin(0) * 180);
        this.ctx.stroke();
      }

      this.ctx.rotate(e.angle);

      const isHit = e.hitFlashTimer && e.hitFlashTimer > 0;
      const baseColor = isHit ? '#ffffff' : e.color;

      this.ctx.fillStyle = baseColor;
      this.ctx.shadowColor = e.color;
      this.ctx.shadowBlur = e.type === 'BOSS' ? 22 : 10;

      if (e.type === 'SWARMER') {
        // Razor-bladed arachnid drone
        this.ctx.beginPath();
        this.ctx.moveTo(e.radius * 1.4, 0);
        this.ctx.lineTo(-e.radius * 0.8, -e.radius * 1.1);
        this.ctx.lineTo(-e.radius * 0.3, 0);
        this.ctx.lineTo(-e.radius * 0.8, e.radius * 1.1);
        this.ctx.closePath();
        this.ctx.fill();

        // Glowing red optic eye
        this.ctx.fillStyle = isHit ? '#ffffff' : '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(e.radius * 0.3, 0, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (e.type === 'BRUTE') {
        // Heavy armored cyber tank
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius * 0.85, 0, Math.PI * 2);
        this.ctx.fill();

        // Armored front plate
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-e.radius * 0.9, -e.radius * 0.9, e.radius * 1.8, e.radius * 1.8);
      } else if (e.type === 'RANGER') {
        // Extended sniper barrel and delta wings
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, -3.5, e.radius * 1.8, 7);

        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(e.radius, 0);
        this.ctx.lineTo(-e.radius, -e.radius);
        this.ctx.lineTo(-e.radius * 0.5, 0);
        this.ctx.lineTo(-e.radius, e.radius);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (e.type === 'DISRUPTOR') {
        // Gyroscopic orb with rotating outer ring
        const spin = performance.now() * 0.005;
        this.ctx.strokeStyle = baseColor;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, e.radius * 1.3, e.radius * 0.7, spin, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // BOSS: Goliath Dreadnought Titan Mech
        // Outer armor ring
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // Quad heavy weapon pods
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(e.radius * 0.2, -22, e.radius * 1.3, 11);
        this.ctx.fillRect(e.radius * 0.2, 11, e.radius * 1.3, 11);

        // Core reactor
        const reactorPulse = 10 + Math.sin(performance.now() * 0.008) * 3;
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, reactorPulse, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();

      // Enemy Health Bar
      if (e.hp < e.maxHp && e.type !== 'BOSS') {
        const barW = e.radius * 2.2;
        const barH = 4;
        const barX = e.x - barW / 2;
        const barY = e.y - e.radius - 10;
        const hpPercent = Math.max(0, e.hp / e.maxHp);

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.fillRect(barX, barY, barW, barH);
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(barX, barY, barW * hpPercent, barH);
      }
    }

    // 8. Draw Particles
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 9. Draw Player Ghost Trails
    for (const trail of this.player.ghostTrails) {
      this.ctx.save();
      this.ctx.translate(trail.x, trail.y);
      this.ctx.rotate(trail.angle);
      this.ctx.globalAlpha = trail.alpha * 0.55;
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.beginPath();
      this.ctx.moveTo(18, 0);
      this.ctx.lineTo(-14, -14);
      this.ctx.lineTo(-8, 0);
      this.ctx.lineTo(-14, 14);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }

    // 10. Draw Handcrafted Player Fighter (The Viper-MK4)
    if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'PERK_SELECT') {
      this.ctx.save();
      this.ctx.translate(this.player.x, this.player.y);

      // Dash or Invulnerability flicker
      if (this.player.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
        this.ctx.globalAlpha = 0.5;
      }

      // Forward Headlight Cone
      this.ctx.save();
      this.ctx.rotate(this.player.angle);
      const lightGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, 220);
      lightGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      lightGrad.addColorStop(0.6, 'rgba(0, 240, 255, 0.05)');
      lightGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      this.ctx.fillStyle = lightGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(15, 0);
      this.ctx.arc(0, 0, 220, -0.32, 0.32);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();

      // Rotating Hexagonal Energy Shield
      if (this.player.shield > 0) {
        this.ctx.save();
        const shieldSpin = performance.now() * 0.002;
        this.ctx.rotate(shieldSpin);
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s / 6) * Math.PI * 2;
          const r = this.player.radius + 8;
          const sx = Math.cos(a) * r;
          const sy = Math.sin(a) * r;
          if (s === 0) this.ctx.moveTo(sx, sy);
          else this.ctx.lineTo(sx, sy);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
      }

      this.ctx.rotate(this.player.angle);

      // Animated Twin Thruster Plasma Plumes
      const flameLength = 12 + Math.random() * 8;
      const flameGrad = this.ctx.createLinearGradient(-15, 0, -15 - flameLength, 0);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.4, '#00f0ff');
      flameGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');

      this.ctx.fillStyle = flameGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(-14, -6);
      this.ctx.lineTo(-14 - flameLength, 0);
      this.ctx.lineTo(-14, 6);
      this.ctx.closePath();
      this.ctx.fill();

      // Dual Rotary Weapon Cannons with Recoil
      const curWeapon = WEAPONS[this.player.currentWeapon];
      const recoilOffset = -this.gunRecoil;

      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(6 + recoilOffset, -10, 16, 4);
      this.ctx.fillRect(6 + recoilOffset, 6, 16, 4);

      // Glowing Gun Muzzles
      this.ctx.fillStyle = curWeapon.color;
      this.ctx.shadowColor = curWeapon.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillRect(18 + recoilOffset, -10, 4, 4);
      this.ctx.fillRect(18 + recoilOffset, 6, 4, 4);

      // Sleek Stealth Delta Fuselage
      this.ctx.fillStyle = '#0f172a';
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.moveTo(22, 0); // Nose tip
      this.ctx.lineTo(-14, -16); // Left wingtip
      this.ctx.lineTo(-8, 0); // Engine intake notch
      this.ctx.lineTo(-14, 16); // Right wingtip
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Tinted Cockpit Glass
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.beginPath();
      this.ctx.ellipse(3, 0, 7, 3.5, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();

      // Orbital Combat Drone
      if (this.player.droneActive) {
        const droneAngle = performance.now() * 0.0035;
        const droneX = this.player.x + Math.cos(droneAngle) * 46;
        const droneY = this.player.y + Math.sin(droneAngle) * 46;

        this.ctx.save();
        this.ctx.fillStyle = '#ec4899';
        this.ctx.shadowColor = '#ec4899';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(droneX, droneY, 6.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    // 11. Draw Floating Numbers
    for (const ft of this.floatingTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      this.ctx.font = `bold ${ft.size}px "JetBrains Mono", monospace`;
      this.ctx.fillStyle = ft.color;
      this.ctx.shadowColor = ft.color;
      this.ctx.shadowBlur = 8;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }

    // 12. Holographic Crosshair and Laser Sight when mouse aiming
    if (this.usingMouseAim && this.state === 'PLAYING') {
      this.ctx.save();
      // Laser sight line
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 6]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.x, this.player.y);
      this.ctx.lineTo(this.mouseX, this.mouseY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Crosshair
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(this.mouseX, this.mouseY, 11, 0, Math.PI * 2);
      this.ctx.moveTo(this.mouseX - 16, this.mouseY);
      this.ctx.lineTo(this.mouseX + 16, this.mouseY);
      this.ctx.moveTo(this.mouseX, this.mouseY - 16);
      this.ctx.lineTo(this.mouseX, this.mouseY + 16);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 13. Off-Screen Threat Radar Arrows
    if (this.state === 'PLAYING') {
      const margin = 26;
      for (const e of this.enemies) {
        const isOffscreen = e.x < 0 || e.x > this.width || e.y < 0 || e.y > this.height;
        if (isOffscreen) {
          const angle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          const edgeX = Math.max(margin, Math.min(this.width - margin, this.player.x + Math.cos(angle) * Math.min(this.width, this.height) * 0.44));
          const edgeY = Math.max(margin, Math.min(this.height - margin, this.player.y + Math.sin(angle) * Math.min(this.width, this.height) * 0.44));

          this.ctx.save();
          this.ctx.translate(edgeX, edgeY);
          this.ctx.rotate(angle);

          const isBoss = e.type === 'BOSS';
          this.ctx.fillStyle = isBoss ? '#ef4444' : (e.type === 'BRUTE' ? '#f97316' : '#f43f5e');
          this.ctx.shadowColor = this.ctx.fillStyle;
          this.ctx.shadowBlur = isBoss ? 14 : 7;

          this.ctx.beginPath();
          this.ctx.moveTo(isBoss ? 13 : 9, 0);
          this.ctx.lineTo(isBoss ? -9 : -7, isBoss ? -9 : -6);
          this.ctx.lineTo(isBoss ? -5 : -3, 0);
          this.ctx.lineTo(isBoss ? -9 : -7, isBoss ? 9 : 6);
          this.ctx.closePath();
          this.ctx.fill();

          if (isBoss) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 9px "JetBrains Mono", monospace';
            this.ctx.fillText('BOSS', -12, -12);
          }

          this.ctx.restore();
        }
      }
    }

    this.ctx.restore();
  }

  private loop = (timestamp: number) => {
    if (this.isDestroyed) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const dt = Math.min(rawDt, 0.05);

    this.update(dt, timestamp);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private startLoop() {
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private setupListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerDash();
      } else if (e.code === 'Digit1') {
        this.switchWeapon('BLASTER');
      } else if (e.code === 'Digit2') {
        this.switchWeapon('SHOTGUN');
      } else if (e.code === 'Digit3') {
        this.switchWeapon('RAILGUN');
      } else if (e.code === 'Digit4') {
        this.switchWeapon('VULCAN');
      } else if (e.code === 'Digit5') {
        this.switchWeapon('MISSILE');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.usingMouseAim = true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.usingMouseAim = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    };

    const handleResize = () => {
      this.resize();
    };

    const handleBlur = () => {
      this.keys = {};
      this.isMouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', handleBlur);

    this.cleanupListeners = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', handleBlur);
    };
  }

  private cleanupListeners: () => void = () => {};

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.cleanupListeners();
  }
}
