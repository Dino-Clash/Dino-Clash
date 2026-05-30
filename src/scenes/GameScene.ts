import Phaser from 'phaser';
import { DinoCharacter } from '../entities/DinoCharacter';
import { BulletManager } from '../systems/BulletManager';
import { InputManager } from '../systems/InputManager';
import { PlatformManager } from '../systems/PlatformManager';
import { AllyFSM } from '../fsm/AllyFSM';
import { ScoreboardUI } from '../ui/ScoreboardUI';
import { CountdownUI } from '../ui/CountdownUI';
import { PauseMenuUI } from '../ui/PauseMenuUI';
import {
  MOVE_SPEED, JUMP_VELOCITY, MELEE_COOLDOWN,
  SHOOT_COOLDOWN, GUN_DISPLAY_W, GUN_DISPLAY_H, GUN_DEPTH, ENEMY_GUN_DEPTH,
  LOYALTY_MAX, LOYALTY_MIN, LOYALTY_FRIENDLY_FIRE_PENALTY, LOYALTY_KILL_PENALTY,
  LOYALTY_WIN_BONUS, LOYALTY_HOSTILE_THRESHOLD, LOYALTY_FRIENDLY_THRESHOLD,
  ROUND_END_DELAY, MELEE_RANGE, createDinoAnimations,
  getRandomDinoKeys, MELEE_CONTACT_DELAY,
} from '../config/GameConstants';
import type { GameMode } from '../config/GameConstants';

export class GameScene extends Phaser.Scene {
  private player: DinoCharacter | null = null;
  private ally: DinoCharacter | null = null;
  private enemies: DinoCharacter[] = [];
  private enemyDirections: number[] = [1, -1];
  private enemyGunIndex: number = -1;
  private enemyMeleeContactSince: number[] = [-1, -1];

  private playerGun: Phaser.GameObjects.Image | null = null;
  private allyGun: Phaser.GameObjects.Image | null = null;
  private enemyGun: Phaser.GameObjects.Image | null = null;

  private inputManager: InputManager | null = null;
  private platformManager: PlatformManager | null = null;
  private bulletManager: BulletManager | null = null;
  private scoreboard: ScoreboardUI | null = null;
  private pauseMenu: PauseMenuUI | null = null;
  private allyFSM: AllyFSM | null = null;

  private playerDinoKey: string = 'doux';
  private allyDinoKey: string = 'vita';
  private enemyDinoKeys: string[] = ['mort', 'tard'];
  private gameMode: GameMode = '1player';
  private currentStageIndex: number = 0;

  private isPaused: boolean = false;
  private roundFrozen: boolean = true;
  private roundScored: boolean = false;
  private loyalty: number = 100;
  private lastPlayerAttackTime: number = 0;
  private isPlayerAttacking: boolean = false;
  private lastAllyShootTime: number = 0;
  private lastEnemyShootTimes: number[] = [0, 0];

  private playerLabel: Phaser.GameObjects.Text | null = null;
  private allyLabel: Phaser.GameObjects.Text | null = null;

  private gameMusic: Phaser.Sound.BaseSound | null = null;
  private musicIndex: number = 0;
  private musicKeys: string[] = ['game_music_1', 'game_music_2', 'game_music_3'];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.load.spritesheet('dino_doux', 'public/assets/dinos/DinoSprites - doux.png', { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('dino_mort', 'public/assets/dinos/DinoSprites - mort.png', { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('dino_tard', 'public/assets/dinos/DinoSprites - tard.png', { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('dino_vita', 'public/assets/dinos/DinoSprites - vita.png', { frameWidth: 24, frameHeight: 24 });
    this.load.image('bg_1', 'public/assets/backgrounds/background1.png');
    this.load.image('bg_2', 'public/assets/backgrounds/background2.png');
    this.load.image('bg_3', 'public/assets/backgrounds/background3.png');
    this.load.image('bg_4', 'public/assets/backgrounds/background4.png');
    this.load.image('bg_5', 'public/assets/backgrounds/background5.png');
    this.load.image('weapon_gun', 'public/assets/weapon/gun.png');
    this.load.image('menu_pausa', 'public/assets/pause_menu/menu_pausa.png');
    this.load.image('btn_resume', 'public/assets/pause_menu/btn_resume.png');
    this.load.image('btn_menu', 'public/assets/pause_menu/btn_menu.png');
    this.load.audio('button_click', 'public/audio/sound_effect/button_click.mp3');
    this.load.audio('game_music_1', 'public/audio/game_music/8 Bit Roll - Fast Inspiring Chiptune By HeatleyBros [L-9VWu2ExYg].mp3');
    this.load.audio('game_music_2', 'public/audio/game_music/8 Bit Climb - Happy Upbeat Chiptune By HeatleyBros [X-vFlnbG9b0].mp3');
    this.load.audio('game_music_3', 'public/audio/game_music/8 Bit Walk - Happy Uplifting Chiptune By HeatleyBros [jdwtLTHULhQ].mp3');
  }

  create(): void {
    createDinoAnimations(this.anims);
    this.inputManager = new InputManager(this);
    this.platformManager = new PlatformManager(this);
    this.bulletManager = new BulletManager(this);
    this.platformManager.setRoundFrozenGetter(() => this.roundFrozen);

    this.physics.world.setBounds(0, -500, 800, 2000);

    const sceneData = this.scene.settings.data as { playerDino?: string; allyDino?: string; gameMode?: GameMode } | undefined;
    this.playerDinoKey = sceneData?.playerDino ?? 'doux';
    this.gameMode = sceneData?.gameMode ?? '1player';
    this.currentStageIndex = 0;
    this.platformManager.setupStage(0);

    this.createCharacters(sceneData);
    this.createGuns();
    this.createCollisions();
    this.createInputHandlers();
    this.createLabels();
    this.createScoreboard();

    this.startCountdown();
    this.startGameMusic();
    this.events.on('shutdown', this.cleanup, this);
  }

  update(_time: number, _delta: number): void {
    if (this.inputManager?.isPausePressed()) {
      this.togglePause();
    }

    if (this.playerLabel && this.player?.active) {
      this.playerLabel.setPosition(this.player.x, this.player.y - 30);
    }
    if (this.allyLabel && this.ally?.active) {
      this.allyLabel.setPosition(this.ally.x, this.ally.y - 30);
    }

    this.updateGuns();

    if (this.roundFrozen || this.isPaused) return;

    if (this.gameMode === '2players') {
      this.handleP1Input();
      this.handleP2Input();
    } else {
      this.handleP1Input();
      this.updateAllyFSM();
    }

    this.updateEnemyCombat();
    this.bulletManager?.cleanup();
    this.checkFallDeath();
  }

  private createCharacters(sceneData: { playerDino?: string; allyDino?: string; gameMode?: GameMode } | undefined): void {
    const p0 = this.platformManager!.getSpawnPosition(0, 0);
    this.player = new DinoCharacter(this, p0.x, p0.y, this.playerDinoKey);
    this.platformManager!.addCollider(this.player);

    this.enemyGroup = this.physics.add.group();

    if (sceneData?.allyDino) {
      this.allyDinoKey = sceneData.allyDino;
      const pool = ['doux', 'mort', 'tard', 'vita'].filter(k => k !== this.playerDinoKey && k !== this.allyDinoKey);
      Phaser.Utils.Array.Shuffle(pool);
      this.enemyDinoKeys = pool as [string, string, string];
    } else {
      const uniqueKeys = getRandomDinoKeys(this.playerDinoKey);
      this.allyDinoKey = uniqueKeys[0];
      this.enemyDinoKeys = [uniqueKeys[1], uniqueKeys[2]];
    }

    const e0 = this.platformManager!.getSpawnPosition(0, 2);
    const e1 = this.platformManager!.getSpawnPosition(0, 3);
    for (let i = 0; i < 2; i++) {
      const spawn = i === 0 ? e0 : e1;
      const enemy = new DinoCharacter(this, spawn.x, spawn.y, this.enemyDinoKeys[i]);
      this.platformManager!.addCollider(enemy);
      this.enemyGroup!.add(enemy);
      this.enemies.push(enemy);
    }

    this.enemyGunIndex = Phaser.Math.Between(0, 1);

    const p1 = this.platformManager!.getSpawnPosition(0, 1);
    this.ally = new DinoCharacter(this, p1.x, p1.y, this.allyDinoKey);
    this.platformManager!.addCollider(this.ally);

    this.allyFSM = new AllyFSM(this, this.ally, this.platformManager!, this.bulletManager!);
  }

  private enemyGroup: Phaser.GameObjects.Group | null = null;

  private createGuns(): void {
    const playerGetsGun = this.gameMode === '2players' ? true : Math.random() < 0.5;
    this.player!.hasGun = playerGetsGun;
    this.ally!.hasGun = !playerGetsGun;

    if (playerGetsGun) {
      this.playerGun = this.add.image(this.player!.x, this.player!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    if (!playerGetsGun) {
      this.allyGun = this.add.image(this.ally!.x, this.ally!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    this.enemyGun = this.add.image(
      this.enemies[this.enemyGunIndex].x,
      this.enemies[this.enemyGunIndex].y,
      'weapon_gun',
    ).setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(ENEMY_GUN_DEPTH);
  }

  private createCollisions(): void {
    this.platformManager!.addColliderToBullets(this.bulletManager!.bullets);

    this.physics.add.overlap(this.bulletManager!.bullets, this.player!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner === 'ally' && this.loyalty >= LOYALTY_HOSTILE_THRESHOLD) return;
      if (owner !== 'enemy' && owner !== 'ally') return;
      this.applyDamageTo(this.player!, this.player!.x - b.x > 0 ? 1 : -1, owner);
      b.destroy();
    });

    this.physics.add.overlap(this.bulletManager!.bullets, this.ally!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner !== 'enemy' && owner !== 'player') return;
      this.applyDamageTo(this.ally!, this.ally!.x - b.x > 0 ? 1 : -1, owner);
      if (owner === 'player') {
        this.loyalty = Math.max(this.loyalty - LOYALTY_FRIENDLY_FIRE_PENALTY, LOYALTY_MIN);
      }
      b.destroy();
    });

    this.physics.add.overlap(this.bulletManager!.bullets, this.enemyGroup!, (bullet, gameObj) => {
      const enemy = gameObj as DinoCharacter;
      if (!this.enemies.includes(enemy)) return;
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner !== 'ally' && owner !== 'player') return;
      this.applyDamageTo(enemy, enemy.x - b.x > 0 ? 1 : -1, owner);
      b.destroy();
    });
  }

  private createInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.roundFrozen) return;
      if (!pointer.leftButtonDown()) return;
      if (this.player!.hasGun && this.playerGun) {
        if (this.time.now > this.lastPlayerAttackTime + SHOOT_COOLDOWN) {
          const angle = this.playerGun.rotation;
          this.bulletManager!.fireBullet(this.playerGun.x, this.playerGun.y, angle, 'player');
          this.lastPlayerAttackTime = this.time.now;
        }
      } else {
        if (this.time.now > this.lastPlayerAttackTime + MELEE_COOLDOWN) {
          this.isPlayerAttacking = true;
          this.lastPlayerAttackTime = this.time.now;
          this.player!.play(`${this.playerDinoKey}_kick`);
        }
      }
    });
  }

  private createLabels(): void {
    this.allyLabel = this.add.text(0, 0, this.gameMode === '2players' ? 'P2' : 'CPU', {
      fontSize: '12px',
      color: this.gameMode === '2players' ? '#00ffff' : '#00ff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(10);

    this.playerLabel = this.add.text(0, 0, 'P1', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(10).setVisible(this.gameMode === '2players');
  }

  private createScoreboard(): void {
    const randomEnemyKey = this.enemyDinoKeys[Phaser.Math.Between(0, 1)];
    this.scoreboard = new ScoreboardUI(this, this.playerDinoKey, randomEnemyKey);
  }

  private cleanup(): void {
    this.player?.destroy();
    this.ally?.destroy();
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.bulletManager?.destroy();
    this.bulletManager = null;
    this.platformManager?.destroy();
    this.platformManager = null;
    this.playerGun?.destroy();
    this.playerGun = null;
    this.allyGun?.destroy();
    this.allyGun = null;
    this.enemyGun?.destroy();
    this.enemyGun = null;
    this.enemyGroup?.destroy(true);
    this.enemyGroup = null;
    this.scoreboard?.destroy();
    this.scoreboard = null;
    this.pauseMenu?.destroy();
    this.pauseMenu = null;
    this.playerLabel?.destroy();
    this.playerLabel = null;
    this.allyLabel?.destroy();
    this.allyLabel = null;
    if (this.gameMusic) {
      this.gameMusic.destroy();
      this.gameMusic = null;
    }
  }

  private togglePause(): void {
    this.pauseMenu?.destroy();
    this.pauseMenu = null;

    if (!this.isPaused) {
      this.isPaused = true;
      this.physics.world.pause();
      this.pauseMenu = new PauseMenuUI(this, () => {
        this.isPaused = false;
        this.physics.world.resume();
        this.pauseMenu?.destroy();
        this.pauseMenu = null;
      }, () => {
        this.time.delayedCall(200, () => window.location.reload());
      });
    } else {
      this.isPaused = false;
      this.physics.world.resume();
    }
  }

  private checkTeamElimination(): void {
    if (this.roundScored) return;
    const playerTeamAlive = [this.player, this.ally].filter(s => s?.active).length;
    const enemyTeamAlive = this.enemies.filter(e => e.active).length;

    if (playerTeamAlive === 0 && enemyTeamAlive > 0) {
      this.roundScored = true;
      this.scoreboard!.incrementEnemy();
      this.time.delayedCall(ROUND_END_DELAY, () => this.resetRound());
    } else if (enemyTeamAlive === 0 && playerTeamAlive > 0) {
      this.roundScored = true;
      this.scoreboard!.incrementPlayer();
      if (this.loyalty <= LOYALTY_FRIENDLY_THRESHOLD) {
        this.loyalty = Math.min(this.loyalty + LOYALTY_WIN_BONUS, LOYALTY_MAX);
      }
      this.time.delayedCall(ROUND_END_DELAY, () => this.resetRound());
    }
  }

  private startCountdown(): void {
    this.roundFrozen = true;
    this.player?.setVelocity(0, 0);
    this.player!.dropThrough = false;
    this.ally?.setVelocity(0, 0);
    this.ally!.dropThrough = false;
    for (const enemy of this.enemies) {
      enemy.setVelocity(0, 0);
      enemy.dropThrough = false;
    }
    new CountdownUI(this, () => {
      this.roundFrozen = false;
    });
  }

  private startGameMusic(): void {
    this.musicIndex = 0;
    this.playCurrentMusic();
  }

  private playCurrentMusic(): void {
    if (this.gameMusic) {
      this.gameMusic.destroy();
      this.gameMusic = null;
    }
    const key = this.musicKeys[this.musicIndex];
    this.gameMusic = this.sound.add(key, { loop: false, volume: 0.3 });
    this.gameMusic.on('complete', () => {
      this.musicIndex = (this.musicIndex + 1) % this.musicKeys.length;
      this.playCurrentMusic();
    });
    this.gameMusic.play();
  }

  private resetRound(): void {
    this.playerGun?.destroy();
    this.playerGun = null;
    this.allyGun?.destroy();
    this.allyGun = null;
    this.enemyGun?.destroy();
    this.enemyGun = null;
    this.bulletManager?.bullets.clear(true, true);

    this.currentStageIndex = (this.currentStageIndex + 1) % 5;
    this.platformManager!.setupStage(this.currentStageIndex);

    const p1 = this.platformManager!.getSpawnPosition(this.currentStageIndex, 0);
    this.player!.respawn(p1.x, p1.y);
    this.platformManager!.addCollider(this.player!);

    const p2 = this.platformManager!.getSpawnPosition(this.currentStageIndex, 1);
    this.ally!.respawn(p2.x, p2.y);
    this.platformManager!.addCollider(this.ally!);
    this.allyFSM?.resetTimers();

    this.enemyGroup!.clear(false, false);
    this.enemyDirections = [Math.random() < 0.5 ? 1 : -1, Math.random() < 0.5 ? 1 : -1];
    const p3 = this.platformManager!.getSpawnPosition(this.currentStageIndex, 2);
    this.enemies[0].respawn(p3.x, p3.y);
    this.platformManager!.addCollider(this.enemies[0]);
    this.enemyGroup!.add(this.enemies[0]);
    const p4 = this.platformManager!.getSpawnPosition(this.currentStageIndex, 3);
    this.enemies[1].respawn(p4.x, p4.y);
    this.platformManager!.addCollider(this.enemies[1]);
    this.enemyGroup!.add(this.enemies[1]);

    const playerGetsGun = this.gameMode === '2players' ? true : Math.random() < 0.5;
    this.player!.hasGun = playerGetsGun;
    this.ally!.hasGun = !playerGetsGun;
    this.enemyGunIndex = Phaser.Math.Between(0, 1);

    if (this.player!.hasGun) {
      this.playerGun = this.add.image(this.player!.x, this.player!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    if (this.ally!.hasGun) {
      this.allyGun = this.add.image(this.ally!.x, this.ally!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    this.enemyGun = this.add.image(
      this.enemies[this.enemyGunIndex].x,
      this.enemies[this.enemyGunIndex].y,
      'weapon_gun',
    ).setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(ENEMY_GUN_DEPTH);

    this.allyLabel?.setVisible(true);
    this.playerLabel?.setVisible(this.gameMode === '2players');

    this.roundScored = false;
    this.lastPlayerAttackTime = 0;
    this.lastEnemyShootTimes = [0, 0];
    this.lastAllyShootTime = 0;
    this.isPlayerAttacking = false;
    this.enemyMeleeContactSince = [-1, -1];
    this.startCountdown();
  }

  private orbitGun(gun: Phaser.GameObjects.Image, x: number, y: number, angle: number): void {
    const GUN_ORBIT_RADIUS = 28;
    gun.setPosition(
      x + Math.cos(angle) * GUN_ORBIT_RADIUS,
      y + Math.sin(angle) * GUN_ORBIT_RADIUS,
    );
    gun.setRotation(angle);
    gun.setFlipY(Math.abs(angle) > Math.PI / 2);
  }

  private updateGuns(): void {
    if (this.enemyGun && this.enemyGunIndex >= 0 && this.enemies[this.enemyGunIndex]?.active) {
      const enemy = this.enemies[this.enemyGunIndex];
      const target = this.player?.active ? this.player : (this.ally?.active ? this.ally : null);
      if (!target) return;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
      this.orbitGun(this.enemyGun, enemy.x, enemy.y, angle);
      this.enemyGun.setVisible(true);
    }

    if (this.allyGun && this.ally?.active) {
      const target =
        this.loyalty < LOYALTY_HOSTILE_THRESHOLD && this.player?.active ? this.player :
          this.enemies.find(e => e.active) ?? null;
      if (target?.active) {
        const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
        this.orbitGun(this.allyGun, this.ally.x, this.ally.y, angle);
      }
    }

    if (this.playerGun && this.player?.active) {
      const pointer = this.input.activePointer;
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
      this.orbitGun(this.playerGun, this.player.x, this.player.y, angle);
    }
  }

  private updateEnemyCombat(): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.active) continue;

      if (enemy.dropStartY !== undefined) {
        if (enemy.y > enemy.dropStartY + 2) {
          enemy.dropStartY = undefined;
        } else {
          continue;
        }
      }

      const onGround = enemy.isOnGround();
      const dinoKey = enemy.dinoKey;
      const hasGun = i === this.enemyGunIndex;

      enemy.setVelocityX(this.enemyDirections[i] * MOVE_SPEED);

      let target: DinoCharacter | null = null;
      let nearestDist = Infinity;
      for (const candidate of [this.player, this.ally]) {
        if (candidate?.active) {
          const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, candidate.x, candidate.y);
          if (d < nearestDist) {
            nearestDist = d;
            target = candidate;
          }
        }
      }
      if (!target) {
        enemy.setVelocityX(0);
        enemy.play(`${dinoKey}_idle`, true);
        continue;
      }

      if (onGround && target.y > enemy.y + 30) {
        if (enemy.stuckSince < 0) {
          enemy.stuckSince = this.time.now;
        } else if (this.time.now - enemy.stuckSince > 1000) {
          this.platformManager!.handleEdgeDropThrough(enemy, target.x);
          enemy.stuckSince = -1;
          enemy.setVelocityX(this.platformManager!.findClosestPlatformEdgeDir(enemy) * MOVE_SPEED);
        }
      } else {
        enemy.stuckSince = -1;
      }

      if (onGround && target.y < enemy.y - 40) {
        if (enemy.jumpStuckSince < 0) {
          enemy.jumpStuckSince = this.time.now;
        } else if (this.time.now - enemy.jumpStuckSince > 2000) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
          enemy.bodyArcade?.setVelocityX(Math.cos(angle) * MOVE_SPEED);
          enemy.bodyArcade?.setVelocityY(JUMP_VELOCITY);
          enemy.jumpStuckSince = -1;
        }
      } else {
        enemy.jumpStuckSince = -1;
      }

      if (hasGun) {
        if (!this.enemyGun) continue;
        const gun = this.enemyGun;
        const angle = Phaser.Math.Angle.Between(gun.x, gun.y, target.x, target.y);

        if (this.platformManager!.hasLineOfSight(gun.x, gun.y, target.x, target.y)) {
          enemy.setVelocityX(0);
          if (this.time.now > this.lastEnemyShootTimes[0] + SHOOT_COOLDOWN) {
            this.bulletManager!.fireBullet(gun.x, gun.y, angle, 'enemy');
            this.lastEnemyShootTimes[0] = this.time.now;
          }
        } else {
          const moveAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
          this.enemyDirections[0] = this.platformManager!.handlePlatformMovement(
            enemy, moveAngle, target.y, onGround,
          );
        }
      } else {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        this.enemyDirections[1] = this.platformManager!.handlePlatformMovement(
          enemy, angle, target.y, onGround,
        );

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
        if (dist < MELEE_RANGE) {
          enemy.setVelocityX(0);
          if (this.enemyMeleeContactSince[i] < 0) {
            this.enemyMeleeContactSince[i] = this.time.now;
          }
          if (this.time.now > this.enemyMeleeContactSince[i] + MELEE_CONTACT_DELAY) {
            this.enemyMeleeContactSince[i] = this.time.now;
            enemy.play(`${dinoKey}_kick`);
            this.applyDamageTo(target, !enemy.flipX ? 1 : -1, 'enemy');
          }
        } else {
          this.enemyMeleeContactSince[i] = -1;
        }
      }

      const eVx = enemy.bodyArcade?.velocity.x ?? 0;
      enemy.faceDirection(eVx);
      enemy.updateAnimation(eVx);
    }
  }

  private checkMeleeHit(): void {
    if (!this.player?.active) return;
    const facingRight = !this.player.flipX;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < MELEE_RANGE) {
        const inFront = facingRight ? enemy.x > this.player.x : enemy.x < this.player.x;
        if (inFront) this.applyDamageTo(enemy, facingRight ? 1 : -1, 'player');
      }
    }

    if (this.ally?.active) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ally.x, this.ally.y);
      if (dist < MELEE_RANGE) {
        const inFront = facingRight ? this.ally.x > this.player.x : this.ally.x < this.player.x;
        if (inFront) {
          this.applyDamageTo(this.ally, facingRight ? 1 : -1, 'player');
          this.loyalty = Math.max(this.loyalty - LOYALTY_FRIENDLY_FIRE_PENALTY, LOYALTY_MIN);
        }
      }
    }
  }

  private applyDamageTo(target: DinoCharacter, dir: number, source?: string): void {
    if (!target.active || target.invulnerable) return;
    if (!target.applyDamage(dir)) return;
    target.startInvulnerability();

    if (target.hp <= 0) {
      target.eliminate();
      this.destroyGunAndLabel(target);

      if (target === this.ally && source === 'player') {
        this.loyalty = Math.max(this.loyalty - LOYALTY_KILL_PENALTY, LOYALTY_MIN);
      }
      this.checkTeamElimination();
    }
  }

  private checkFallDeath(): void {
    const killSprite = (sprite: DinoCharacter) => {
      if (!sprite.active) return;
      sprite.eliminate();
      this.destroyGunAndLabel(sprite);
    };

    if (this.player?.active && this.player.hasFallenOffWorld()) killSprite(this.player);
    if (this.ally?.active && this.ally.hasFallenOffWorld()) killSprite(this.ally);
    for (const enemy of this.enemies) {
      if (enemy.active && enemy.hasFallenOffWorld()) killSprite(enemy);
    }
    this.checkTeamElimination();
  }

  private destroyGunAndLabel(sprite: DinoCharacter): void {
    if (sprite === this.player) {
      this.playerGun?.destroy();
      this.playerGun = null;
      if (this.playerLabel) this.playerLabel.setVisible(false);
    }
    if (sprite === this.ally) {
      this.allyGun?.destroy();
      this.allyGun = null;
      if (this.allyLabel) this.allyLabel.setVisible(false);
    }
    const enemyIdx = this.enemies.indexOf(sprite);
    if (enemyIdx >= 0 && enemyIdx === this.enemyGunIndex) {
      this.enemyGun?.destroy();
      this.enemyGun = null;
    }
  }

  private handleP1Input(): void {
    if (!this.player?.active) return;
    const onGround = this.player.isOnGround();

    if (onGround && this.inputManager!.isJumpP1(this.gameMode)) {
      this.player.bodyArcade?.setVelocityY(JUMP_VELOCITY);
    }

    if (onGround && this.inputManager!.isDropP1(this.gameMode)) {
      this.player.startDropThrough();
    }

    const moveLeft = this.inputManager!.isLeftP1(this.gameMode);
    const moveRight = this.inputManager!.isRightP1(this.gameMode);

    if (moveLeft) {
      this.player.bodyArcade!.setVelocityX(-MOVE_SPEED);
    } else if (moveRight) {
      this.player.bodyArcade!.setVelocityX(MOVE_SPEED);
    } else {
      this.player.bodyArcade!.setVelocityX(0);
    }

    const pVx = this.player.bodyArcade?.velocity.x ?? 0;
    this.player.faceDirection(pVx);
    this.player.updateAnimation(pVx);

    if (this.inputManager!.isMeleeP1() && this.time.now > this.lastPlayerAttackTime + MELEE_COOLDOWN) {
      this.isPlayerAttacking = true;
      this.lastPlayerAttackTime = this.time.now;
      this.player.play(`${this.playerDinoKey}_kick`);
    }

    if (this.isPlayerAttacking) {
      this.checkMeleeHit();
      this.isPlayerAttacking = false;
    }
  }

  private handleP2Input(): void {
    if (!this.ally?.active) return;
    const onGround = this.ally.isOnGround();

    if (onGround && this.inputManager!.isJumpP2()) {
      this.ally.bodyArcade?.setVelocityY(JUMP_VELOCITY);
    }

    if (onGround && this.inputManager!.isDropP2()) {
      this.ally.startDropThrough();
    }

    if (this.inputManager!.isLeftP2()) {
      this.ally.bodyArcade!.setVelocityX(-MOVE_SPEED);
    } else if (this.inputManager!.isRightP2()) {
      this.ally.bodyArcade!.setVelocityX(MOVE_SPEED);
    } else {
      this.ally.bodyArcade!.setVelocityX(0);
    }

    const aVx = this.ally.bodyArcade?.velocity.x ?? 0;
    this.ally.faceDirection(aVx);
    this.ally.updateAnimation(aVx);

    if (this.inputManager!.isMeleeP2() && this.time.now > this.lastAllyShootTime + MELEE_COOLDOWN) {
      this.lastAllyShootTime = this.time.now;
      this.ally.play(`${this.allyDinoKey}_kick`);
      let target: DinoCharacter | null = null;
      let nearestDist = Infinity;
      for (const candidate of [this.player, ...this.enemies]) {
        if (candidate?.active) {
          const d = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, candidate.x, candidate.y);
          if (d < nearestDist) {
            nearestDist = d;
            target = candidate;
          }
        }
      }
      if (target && nearestDist < MELEE_RANGE) {
        this.applyDamageTo(target, !this.ally.flipX ? 1 : -1, 'ally');
      }
    }
  }

  private updateAllyFSM(): void {
    if (!this.ally || !this.ally.active) return;

    const state = this.allyFSM!.update(this.loyalty, this.player, this.enemies, this.ally.hasGun);

    if (this.allyLabel) {
      if (this.gameMode === '2players') {
        this.allyLabel.setText('P2');
        this.allyLabel.setColor('#00ffff');
      } else {
        const label = state === 'Loyal' ? 'CPU' : state === 'Hostile' ? 'Angry' : state;
        const color = state === 'Loyal' ? '#00ff00' : state === 'Hostile' ? '#ff0000' : '#ffff00';
        this.allyLabel.setText(label);
        this.allyLabel.setColor(color);
      }
      this.allyLabel.setPosition(this.ally.x, this.ally.y - 30);
    }
  }
}
