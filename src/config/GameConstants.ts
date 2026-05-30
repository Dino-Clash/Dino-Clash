import Phaser from 'phaser';

export type GameMode = '1player' | '2players';

export type DinoKey = 'doux' | 'mort' | 'tard' | 'vita';

export const DINO_KEYS: DinoKey[] = ['vita', 'mort', 'tard', 'doux'];

export const GUN_ORBIT_RADIUS = 28;
export const BULLET_SPEED = 800;
export const SHOOT_COOLDOWN = 2000;
export const MELEE_COOLDOWN = 1000;
export const MOVE_SPEED = 300;
export const JUMP_VELOCITY = -600;
export const KNOCKBACK_VELOCITY_X = 400;
export const MELEE_RANGE = 40;
export const STUCK_DELAY = 1000;
export const JUMP_STUCK_DELAY = 2000;
export const DROP_THROUGH_DELAY = 400;
export const DROP_VELOCITY_Y = 50;
export const HP_MAX = 3;
export const INVULN_DURATION = 1000;
export const KILL_Y = 600;
export const COUNTDOWN_INTERVAL = 1000;
export const GUN_DISPLAY_W = 36;
export const GUN_DISPLAY_H = 26;
export const GUN_DEPTH = 5;
export const ENEMY_GUN_DEPTH = 0;
export const BULLET_SIZE = 6;
export const BULLET_OFFSET = 15;
export const SCOREBOARD_Y = 15;
export const LOYALTY_MAX = 100;
export const LOYALTY_MIN = -100;
export const LOYALTY_FRIENDLY_FIRE_PENALTY = 10;
export const LOYALTY_KILL_PENALTY = 25;
export const LOYALTY_WIN_BONUS = 15;
export const LOYALTY_HOSTILE_THRESHOLD = -20;
export const LOYALTY_FRIENDLY_THRESHOLD = 20;
export const ROUND_END_DELAY = 4000;
export const HEIGHT_THRESHOLD_DOWN = 30;
export const HEIGHT_THRESHOLD_UP = 40;
export const SPEED_BONUS_DOWN = 500;
export const EDGE_DROP_SPEED = 100;
export const MELEE_CONTACT_DELAY = 250;

export function getDinoColor(dinoKey: string): string {
  switch (dinoKey) {
    case 'doux': return '#0000ff';
    case 'mort': return '#ff0000';
    case 'tard': return '#ffff00';
    case 'vita': return '#00ff00';
    default: return '#ffffff';
  }
}

export function getRandomDinoKeys(exclude: string): DinoKey[] {
  const pool = DINO_KEYS.filter(k => k !== exclude);
  Phaser.Utils.Array.Shuffle(pool);
  return pool.slice(0, 3);
}

export function createDinoAnimations(anims: Phaser.Animations.AnimationManager): void {
  if (anims.exists('doux_hurt')) return;
  for (const key of DINO_KEYS) {
    anims.create({
      key: `${key}_idle`,
      frames: anims.generateFrameNumbers(`dino_${key}`, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    anims.create({
      key: `${key}_run`,
      frames: anims.generateFrameNumbers(`dino_${key}`, { start: 4, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: `${key}_attack`,
      frames: anims.generateFrameNumbers(`dino_${key}`, { start: 10, end: 12 }),
      frameRate: 10,
      repeat: 0,
    });
    anims.create({
      key: `${key}_kick`,
      frames: anims.generateFrameNumbers(`dino_${key}`, { start: 10, end: 12 }),
      frameRate: 10,
      repeat: 0,
    });
    anims.create({
      key: `${key}_hurt`,
      frames: anims.generateFrameNumbers(`dino_${key}`, { start: 13, end: 16 }),
      frameRate: 8,
      repeat: 0,
    });
    anims.create({
      key: `${key}_jump`,
      frames: anims.generateFrameNumbers(`dino_${key}`, { start: 4, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });
  }
}

export interface PlatformDef {
  x: number; y: number; w: number; h: number; color: number; stroke: number;
}

export const STAGE_LAYOUTS: PlatformDef[][] = [
  [
    { x: 150, y: 480, w: 200, h: 16, color: 0x4a7023, stroke: 0x2d4a15 },
    { x: 650, y: 480, w: 200, h: 16, color: 0x4a7023, stroke: 0x2d4a15 },
    { x: 80, y: 360, w: 160, h: 16, color: 0x6b8e23, stroke: 0x4a7023 },
    { x: 400, y: 360, w: 160, h: 16, color: 0x6b8e23, stroke: 0x4a7023 },
    { x: 720, y: 360, w: 160, h: 16, color: 0x6b8e23, stroke: 0x4a7023 },
    { x: 150, y: 240, w: 160, h: 16, color: 0x8fbc3b, stroke: 0x4a7023 },
    { x: 650, y: 240, w: 160, h: 16, color: 0x8fbc3b, stroke: 0x4a7023 },
    { x: 400, y: 120, w: 180, h: 16, color: 0x8fbc3b, stroke: 0x4a7023 },
  ],
  [
    { x: 400, y: 490, w: 300, h: 16, color: 0x8B5E3C, stroke: 0x6B4226 },
    { x: 200, y: 370, w: 180, h: 16, color: 0xA0724B, stroke: 0x8B5E3C },
    { x: 600, y: 370, w: 180, h: 16, color: 0xA0724B, stroke: 0x8B5E3C },
    { x: 400, y: 250, w: 200, h: 16, color: 0xC4956A, stroke: 0xA0724B },
    { x: 250, y: 140, w: 120, h: 16, color: 0xC4956A, stroke: 0xA0724B },
    { x: 550, y: 140, w: 120, h: 16, color: 0xC4956A, stroke: 0xA0724B },
  ],
  [
    { x: 150, y: 480, w: 150, h: 16, color: 0xCC6600, stroke: 0x994D00 },
    { x: 400, y: 490, w: 160, h: 16, color: 0xCC6600, stroke: 0x994D00 },
    { x: 650, y: 480, w: 150, h: 16, color: 0xCC6600, stroke: 0x994D00 },
    { x: 120, y: 360, w: 200, h: 16, color: 0xFF8833, stroke: 0xCC6600 },
    { x: 680, y: 360, w: 200, h: 16, color: 0xFF8833, stroke: 0xCC6600 },
    { x: 400, y: 240, w: 240, h: 16, color: 0xFFAA55, stroke: 0xFF8833 },
    { x: 400, y: 130, w: 160, h: 16, color: 0xFFAA55, stroke: 0xFF8833 },
  ],
  [
    { x: 400, y: 480, w: 500, h: 16, color: 0x8B5E3C, stroke: 0x6B4226 },
    { x: 300, y: 370, w: 160, h: 16, color: 0xA0724B, stroke: 0x8B5E3C },
    { x: 500, y: 370, w: 160, h: 16, color: 0xA0724B, stroke: 0x8B5E3C },
    { x: 120, y: 270, w: 140, h: 16, color: 0xC4956A, stroke: 0xA0724B },
    { x: 400, y: 250, w: 140, h: 16, color: 0xC4956A, stroke: 0xA0724B },
    { x: 680, y: 270, w: 140, h: 16, color: 0xC4956A, stroke: 0xA0724B },
    { x: 400, y: 140, w: 120, h: 16, color: 0xC4956A, stroke: 0xA0724B },
  ],
  [
    { x: 200, y: 480, w: 180, h: 16, color: 0x8B0000, stroke: 0x660000 },
    { x: 600, y: 480, w: 180, h: 16, color: 0x8B0000, stroke: 0x660000 },
    { x: 400, y: 380, w: 200, h: 16, color: 0xCC0000, stroke: 0x8B0000 },
    { x: 80, y: 310, w: 140, h: 16, color: 0xCC0000, stroke: 0x8B0000 },
    { x: 720, y: 310, w: 140, h: 16, color: 0xCC0000, stroke: 0x8B0000 },
    { x: 250, y: 210, w: 140, h: 16, color: 0xFF4444, stroke: 0xCC0000 },
    { x: 550, y: 210, w: 140, h: 16, color: 0xFF4444, stroke: 0xCC0000 },
    { x: 400, y: 110, w: 140, h: 16, color: 0xFF4444, stroke: 0xCC0000 },
  ],
];

export const STAGE_SPAWNS: { x: number; y: number }[][] = [
  [
    { x: 80, y: 226 },
    { x: 120, y: 226 },
    { x: 680, y: 226 },
    { x: 720, y: 226 },
  ],
  [
    { x: 380, y: 236 },
    { x: 420, y: 236 },
    { x: 250, y: 126 },
    { x: 550, y: 126 },
  ],
  [
    { x: 150, y: 436 },
    { x: 400, y: 446 },
    { x: 650, y: 436 },
    { x: 400, y: 86 },
  ],
  [
    { x: 300, y: 436 },
    { x: 500, y: 436 },
    { x: 120, y: 226 },
    { x: 680, y: 226 },
  ],
  [
    { x: 200, y: 436 },
    { x: 600, y: 436 },
    { x: 250, y: 166 },
    { x: 550, y: 166 },
  ],
];
