import Phaser from 'phaser';

const GUN_ORBIT_RADIUS = 28;
const BULLET_SPEED = 800;
const SHOOT_COOLDOWN = 2000;
const MELEE_COOLDOWN = 1000;
const MOVE_SPEED = 300;
const JUMP_VELOCITY = -600;
const KNOCKBACK_VELOCITY_X = 400;
const MELEE_RANGE = 40;
const STUCK_DELAY = 1000;
const JUMP_STUCK_DELAY = 2000;
const DROP_THROUGH_DELAY = 400;
const DROP_VELOCITY_Y = 50;
const HP_MAX = 3;
const INVULN_DURATION = 1000;
const KILL_Y = 600;
const COUNTDOWN_INTERVAL = 1000;
const GUN_DISPLAY_W = 36;
const GUN_DISPLAY_H = 26;
const GUN_DEPTH = 5;
const ENEMY_GUN_DEPTH = 0;
const BULLET_SIZE = 6;
const BULLET_OFFSET = 15;
const SCOREBOARD_Y = 15;
const LOYALTY_MAX = 100;
const LOYALTY_MIN = -100;
const LOYALTY_FRIENDLY_FIRE_PENALTY = 10;
const LOYALTY_KILL_PENALTY = 25;
const LOYALTY_WIN_BONUS = 15;
const LOYALTY_HOSTILE_THRESHOLD = -20;
const LOYALTY_FRIENDLY_THRESHOLD = 20;
const ROUND_END_DELAY = 4000;
const HEIGHT_THRESHOLD_DOWN = 30;
const HEIGHT_THRESHOLD_UP = 40;
const SPEED_BONUS_DOWN = 500;
const EDGE_DROP_SPEED = 100;
const MELEE_CONTACT_DELAY = 250;

export class GameScene extends Phaser.Scene {
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keySpace: Phaser.Input.Keyboard.Key | null = null;
  private keyF: Phaser.Input.Keyboard.Key | null = null;
  private keyS: Phaser.Input.Keyboard.Key | null = null;
  private keyH: Phaser.Input.Keyboard.Key | null = null;
  private keyESC: Phaser.Input.Keyboard.Key | null = null;

  private isPaused: boolean = false;
  private pauseOverlay: Phaser.GameObjects.Rectangle | null = null;
  private pauseFrame: Phaser.GameObjects.Image | null = null;
  private resumeButton: Phaser.GameObjects.Image | null = null;
  private menuButton: Phaser.GameObjects.Image | null = null;

  private enemies: Phaser.Physics.Arcade.Sprite[] = [];
  private enemyDirections: number[] = [1, -1];
  private enemyGun: Phaser.GameObjects.Image | null = null;
  private enemyGunIndex: number = -1;
  private enemyGroup: Phaser.GameObjects.Group | null = null;
  private lastEnemyShootTimes: number[] = [0, 0];
  private lastAllyShootTime: number = 0;

  private ally: Phaser.Physics.Arcade.Sprite | null = null;
  private allyGun: Phaser.GameObjects.Image | null = null;
  private loyalty: number = 100;
  private allyFSMText: Phaser.GameObjects.Text | null = null;

  private playerGun: Phaser.GameObjects.Image | null = null;
  private playerHasGun: boolean = false;
  private allyHasGun: boolean = false;
  private lastPlayerShootTime: number = 0;
  private bullets: Phaser.GameObjects.Group | null = null;

  private playerInvulnerable: boolean = false;
  private allyInvulnerable: boolean = false;
  private enemyInvulnerable: boolean[] = [false, false];

  private isPlayerAttacking: boolean = false;
  private lastPlayerAttackTime: number = 0;

  private playerScore: number = 0;
  private enemyScore: number = 0;
  private enemyScoreColor: string = '#ff0000';
  private playerScoreText: Phaser.GameObjects.Text | null = null;
  private enemyScoreText: Phaser.GameObjects.Text | null = null;
  private roundScored: boolean = false;
  private roundFrozen: boolean = true;
  private gameMode: '1player' | '2players' = '1player';
  private playerLabel: Phaser.GameObjects.Text | null = null;

  private enemyStuckSince: number[] = [-1, -1];
  private enemyJumpStuckSince: number[] = [-1, -1];
  private enemyMeleeContactSince: number[] = [-1, -1];
  private allyStuckSince: number = -1;
  private allyJumpStuckSince: number = -1;
  private playerDinoKey: string = 'doux';
  private allyDinoKey: string = 'vita';
  private enemyDinoKeys: string[] = ['mort', 'tard'];
  private currentStageIndex: number = 0;
  private bgImage: Phaser.GameObjects.Image | null = null;

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
  }

  create(): void {
    this.cursors = this.input.keyboard?.createCursorKeys() ?? null;
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) ?? null;
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) ?? null;
    this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;
    this.keyF = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F) ?? null;
    this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S) ?? null;
    this.keyH = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H) ?? null;
    this.keyESC = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? null;

    this.events.on('shutdown', this.cleanup, this);

    this.isPaused = false;
    this.physics.world.resume();
    this.enemies = [];
    this.enemyDirections = [1, -1];
    this.lastEnemyShootTimes = [0, 0];
    this.enemyInvulnerable = [false, false];
    this.enemyStuckSince = [-1, -1];
    this.enemyJumpStuckSince = [-1, -1];
    this.enemyMeleeContactSince = [-1, -1];
    this.allyStuckSince = -1;
    this.allyJumpStuckSince = -1;
    this.loyalty = 100;
    this.playerScore = 0;
    this.enemyScore = 0;
    this.roundScored = false;
    this.playerInvulnerable = false;
    this.allyInvulnerable = false;
    this.isPlayerAttacking = false;
    this.lastPlayerShootTime = 0;
    this.lastAllyShootTime = 0;
    this.lastPlayerAttackTime = 0;
    this.playerHasGun = false;
    this.allyHasGun = false;
    this.playerGun = null;
    this.allyGun = null;
    this.enemyGun = null;
    this.enemyGunIndex = -1;

    this.physics.world.setBounds(0, -500, 800, 2000);

    const sceneData = this.scene.settings.data as { playerDino?: string; allyDino?: string; gameMode?: '1player' | '2players' } | undefined;
    this.playerDinoKey = sceneData?.playerDino ?? 'doux';
    this.gameMode = sceneData?.gameMode ?? '1player';
    this.currentStageIndex = 0;
    this.setupStage(0);

    const p0 = this.getSpawnPosition(0, 0);
    this.player = this.createCharacterSprite(p0.x, p0.y, this.playerDinoKey);

    this.createAllAnimations();
    this.enemyGroup = this.add.group();

    if (sceneData?.allyDino) {
      this.allyDinoKey = sceneData.allyDino;
      const pool = ['doux', 'mort', 'tard', 'vita'].filter(k => k !== this.playerDinoKey && k !== this.allyDinoKey);
      Phaser.Utils.Array.Shuffle(pool);
      this.enemyDinoKeys = pool;
    } else {
      const uniqueKeys = this.getRandomDinoKeys(this.playerDinoKey);
      this.allyDinoKey = uniqueKeys[0];
      this.enemyDinoKeys = [uniqueKeys[1], uniqueKeys[2]];
    }

    const e0 = this.getSpawnPosition(0, 2);
    const e1 = this.getSpawnPosition(0, 3);
    const enemySpawns = [
      { x: e0.x, y: e0.y },
      { x: e1.x, y: e1.y },
    ];

    for (let i = 0; i < enemySpawns.length; i++) {
      const spawn = enemySpawns[i];
      const dinoName = this.enemyDinoKeys[i];
      const enemy = this.createCharacterSprite(spawn.x, spawn.y, dinoName);
      this.enemies.push(enemy);
      this.enemyGroup.add(enemy);
    }

    this.enemyGunIndex = Phaser.Math.Between(0, 1);
    this.enemyGun = this.add.image(
      this.enemies[this.enemyGunIndex].x,
      this.enemies[this.enemyGunIndex].y,
      'weapon_gun',
    ).setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(ENEMY_GUN_DEPTH);

    const p1 = this.getSpawnPosition(0, 1);
    this.ally = this.createCharacterSprite(p1.x, p1.y, this.allyDinoKey);

    const playerGetsGun = this.gameMode === '2players' ? true : Math.random() < 0.5;
    this.playerHasGun = playerGetsGun;
    this.allyHasGun = !playerGetsGun;

    if (this.playerHasGun) {
      this.playerGun = this.add.image(this.player!.x, this.player!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    if (this.allyHasGun) {
      this.allyGun = this.add.image(this.ally!.x, this.ally!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }

    this.bullets = this.add.group();

    this.physics.add.collider(this.bullets!, this.platforms!, (bullet) => {
      (bullet as Phaser.GameObjects.Rectangle).destroy();
    });

    this.physics.add.overlap(this.bullets!, this.player!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner === 'ally' && this.loyalty >= LOYALTY_HOSTILE_THRESHOLD) return;
      if (owner !== 'enemy' && owner !== 'ally') return;
      this.applyDamageTo(this.player!, this.player!.x - b.x > 0 ? 1 : -1, owner);
      b.destroy();
    });

    this.physics.add.overlap(this.bullets!, this.ally!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner !== 'enemy' && owner !== 'player') return;
      this.applyDamageTo(this.ally!, this.ally!.x - b.x > 0 ? 1 : -1, owner);
      if (owner === 'player') {
        this.loyalty = Math.max(this.loyalty - LOYALTY_FRIENDLY_FIRE_PENALTY, LOYALTY_MIN);
      }
      b.destroy();
    });

    this.physics.add.overlap(this.bullets!, this.enemyGroup!, (bullet, enemy) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner !== 'ally' && owner !== 'player') return;
      const sp = enemy as Phaser.Physics.Arcade.Sprite;
      this.applyDamageTo(sp, sp.x - b.x > 0 ? 1 : -1, owner);
      b.destroy();
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.roundFrozen) return;
      if (!pointer.leftButtonDown()) return;
      if (this.playerHasGun && this.playerGun) {
        if (this.time.now > this.lastPlayerShootTime + SHOOT_COOLDOWN) {
          const angle = this.playerGun.rotation;
          this.fireBullet(this.playerGun.x, this.playerGun.y, angle, 'player');
          this.lastPlayerShootTime = this.time.now;
        }
      } else {
        if (this.time.now > this.lastPlayerAttackTime + MELEE_COOLDOWN) {
          this.isPlayerAttacking = true;
          this.lastPlayerAttackTime = this.time.now;
          this.player!.play(`${this.playerDinoKey}_kick`);
        }
      }
    });

    this.allyFSMText = this.add.text(0, 0, this.gameMode === '2players' ? 'P2' : 'CPU', {
      fontSize: '12px',
      color: this.gameMode === '2players' ? '#00ffff' : '#00ff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(10);

    this.playerLabel = this.add.text(0, 0, 'P1', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(10).setVisible(this.gameMode === '2players');

    const playerDinoKey = this.player?.getData('dinoKey') as string ?? 'doux';
    const pColor = this.getDinoColor(playerDinoKey);
    const randomEnemyKey = this.enemyDinoKeys[Phaser.Math.Between(0, 1)];
    this.enemyScoreColor = this.getDinoColor(randomEnemyKey);

    this.playerScoreText = this.add.text(390, SCOREBOARD_Y, '0', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: pColor,
    }).setOrigin(1, 0).setDepth(100);

    this.add.text(400, SCOREBOARD_Y, ' - ', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0).setDepth(100);

    this.enemyScoreText = this.add.text(410, SCOREBOARD_Y, '0', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: this.enemyScoreColor,
    }).setOrigin(0, 0).setDepth(100);

    this.player!.play(`${this.playerDinoKey}_idle`);
    this.startCountdown();
  }

  private cleanup(): void {
    this.player?.destroy();
    this.ally?.destroy();
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.enemyGroup?.destroy(true);
    this.enemyGroup = null;
    this.bullets?.destroy(true);
    this.bullets = null;
    this.platforms?.destroy();
    this.platforms = null;
    this.playerGun?.destroy();
    this.playerGun = null;
    this.allyGun?.destroy();
    this.allyGun = null;
    this.enemyGun?.destroy();
    this.enemyGun = null;
    this.bgImage?.destroy();
    this.bgImage = null;
    this.playerScoreText?.destroy();
    this.playerScoreText = null;
    this.enemyScoreText?.destroy();
    this.enemyScoreText = null;
    this.allyFSMText?.destroy();
    this.allyFSMText = null;
    this.playerLabel?.destroy();
    this.playerLabel = null;
    this.pauseOverlay?.destroy();
    this.pauseOverlay = null;
    this.pauseFrame?.destroy();
    this.pauseFrame = null;
    this.resumeButton?.destroy();
    this.resumeButton = null;
    this.menuButton?.destroy();
    this.menuButton = null;
  }

  update(_time: number, _delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keyESC!)) {
      this.togglePause();
    }

    if (this.playerLabel && this.player?.active) {
      this.playerLabel.setPosition(this.player.x, this.player.y - 30);
    }
    if (this.allyFSMText && this.ally?.active) {
      this.allyFSMText.setPosition(this.ally.x, this.ally.y - 30);
    }
    this.updateGuns();

    if (this.roundFrozen || this.isPaused) return;

    if (this.gameMode === '2players') {
      this.handleP1Input();
      this.handleP2Input();
    } else {
      this.handleP1Input();
    }

    if (this.gameMode !== '2players') {
      this.updateAllyFSM();
    }
    this.updateEnemyCombat();
    this.cleanupBullets();
    this.checkFallDeath();
  }

  private togglePause(): void {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    if (this.pauseFrame) { this.pauseFrame.destroy(); this.pauseFrame = null; }
    if (this.resumeButton) { this.resumeButton.destroy(); this.resumeButton = null; }
    if (this.menuButton) { this.menuButton.destroy(); this.menuButton = null; }

    if (!this.isPaused) {
      this.isPaused = true;
      this.physics.world.pause();
      this.createPauseMenu();
    } else {
      this.isPaused = false;
      this.physics.world.resume();
    }
  }

  private createPauseMenu(): void {
    this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6).setDepth(300).setScrollFactor(0);

    this.pauseFrame = this.add.image(400, 300, 'menu_pausa').setScale(0.47).setDepth(301).setScrollFactor(0);

    const btnScale = 0.3;
    this.resumeButton = this.add.image(400, 290, 'btn_resume').setScale(btnScale).setDepth(302).setScrollFactor(0).setInteractive({ useHandCursor: true });
    this.menuButton = this.add.image(400, 365, 'btn_menu').setScale(btnScale).setDepth(302).setScrollFactor(0).setInteractive({ useHandCursor: true });

    const addHover = (btn: Phaser.GameObjects.Image) => {
      btn.on('pointerover', () => {
        this.tweens.add({ targets: btn, scale: btnScale * 1.05, duration: 100, ease: 'Back.easeOut' });
      });
      btn.on('pointerout', () => {
        this.tweens.add({ targets: btn, scale: btnScale, duration: 100, ease: 'Back.easeOut' });
      });
    };
    addHover(this.resumeButton);
    addHover(this.menuButton);

    const playClick = () => this.sound.play('button_click', { volume: 0.5 });

    this.resumeButton.on('pointerdown', () => {
      playClick();
      this.togglePause();
    });

    this.menuButton.on('pointerdown', () => {
      playClick();
      this.time.delayedCall(200, () => window.location.reload());
    });
  }

  private getDinoColor(dinoKey: string): string {
    switch (dinoKey) {
      case 'doux': return '#0000ff';
      case 'mort': return '#ff0000';
      case 'tard': return '#ffff00';
      case 'vita': return '#00ff00';
      default: return '#ffffff';
    }
  }

  private updateScoreText(): void {
    if (this.playerScoreText) {
      this.playerScoreText.setText(String(this.playerScore));
    }
    if (this.enemyScoreText) {
      this.enemyScoreText.setText(String(this.enemyScore));
    }
  }

  private checkTeamElimination(): void {
    if (this.roundScored) return;
    const playerTeamAlive = [this.player, this.ally].filter(s => s?.active).length;
    const enemyTeamAlive = this.enemies.filter(e => e.active).length;

    if (playerTeamAlive === 0 && enemyTeamAlive > 0) {
      this.roundScored = true;
      this.enemyScore++;
      this.updateScoreText();
      this.time.delayedCall(ROUND_END_DELAY, () => this.resetRound());
    } else if (enemyTeamAlive === 0 && playerTeamAlive > 0) {
      this.roundScored = true;
      this.playerScore++;
      if (this.loyalty <= LOYALTY_FRIENDLY_THRESHOLD) {
        this.loyalty = Math.min(this.loyalty + LOYALTY_WIN_BONUS, LOYALTY_MAX);
      }
      this.updateScoreText();
      this.time.delayedCall(ROUND_END_DELAY, () => this.resetRound());
    }
  }

  private startCountdown(): void {
    this.roundFrozen = true;
    this.player?.setVelocity(0, 0);
    this.player?.setData('dropThrough', false);
    this.ally?.setVelocity(0, 0);
    this.ally?.setData('dropThrough', false);
    for (const enemy of this.enemies) {
      enemy.setVelocity(0, 0);
      enemy.setData('dropThrough', false);
    }

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5).setDepth(200).setScrollFactor(0);
    const countText = this.add.text(400, 300, '', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

    const numbers = ['3', '2', '1'];
    let index = 0;
    const tick = (): void => {
      if (index < numbers.length) {
        countText.setText(numbers[index]);
        index++;
        this.time.delayedCall(COUNTDOWN_INTERVAL, tick);
      } else {
        overlay.destroy();
        countText.destroy();
        this.roundFrozen = false;
      }
    };
    tick();
  }

  private respawnCharacter(sprite: Phaser.Physics.Arcade.Sprite, x: number, y: number, dinoKey: string): void {
    sprite.setPosition(x, y);
    sprite.setActive(true).setVisible(true);
    sprite.setAlpha(1);
    sprite.setTexture(`dino_${dinoKey}`);
    sprite.setData('hp', HP_MAX);
    sprite.setData('invulnUntil', 0);
    sprite.setData('dinoKey', dinoKey);
    sprite.setData('dropThrough', false);
    sprite.setData('dropStartY', undefined);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(true);
      body.setAllowGravity(true);
      body.setVelocity(0, 0);
    }
    sprite.refreshBody();
    if (body) {
      body.setSize(14, 18);
      body.setOffset(5, 3);
    }

    sprite.play(`${dinoKey}_idle`, true);
    sprite.setFlipX(false);
  }

  private resetRound(): void {
    if (this.playerGun) { this.playerGun.destroy(); this.playerGun = null; }
    if (this.allyGun) { this.allyGun.destroy(); this.allyGun = null; }
    if (this.enemyGun) { this.enemyGun.destroy(); this.enemyGun = null; }

    this.bullets?.clear(true, true);

    this.currentStageIndex = (this.currentStageIndex + 1) % 5;
    this.setupStage(this.currentStageIndex);

    const p1 = this.getSpawnPosition(this.currentStageIndex, 0);
    this.respawnCharacter(this.player!, p1.x, p1.y, this.playerDinoKey);

    const p2 = this.getSpawnPosition(this.currentStageIndex, 1);
    this.respawnCharacter(this.ally!, p2.x, p2.y, this.allyDinoKey);
    if (this.allyFSMText) {
      this.allyFSMText.setVisible(true);
      if (this.gameMode === '2players') {
        this.allyFSMText.setText('P2');
        this.allyFSMText.setColor('#00ffff');
      } else {
        this.allyFSMText.setText('CPU');
        this.allyFSMText.setColor('#00ff00');
      }
    }
    if (this.playerLabel) {
      this.playerLabel.setVisible(this.gameMode === '2players');
    }

    this.enemyDirections = [Math.random() < 0.5 ? 1 : -1, Math.random() < 0.5 ? 1 : -1];
    const p3 = this.getSpawnPosition(this.currentStageIndex, 2);
    this.respawnCharacter(this.enemies[0], p3.x, p3.y, this.enemyDinoKeys[0]);
    const p4 = this.getSpawnPosition(this.currentStageIndex, 3);
    this.respawnCharacter(this.enemies[1], p4.x, p4.y, this.enemyDinoKeys[1]);

    const playerGetsGun = this.gameMode === '2players' ? true : Math.random() < 0.5;
    this.playerHasGun = playerGetsGun;
    this.allyHasGun = !playerGetsGun;
    this.enemyGunIndex = Phaser.Math.Between(0, 1);

    if (this.playerHasGun) {
      this.playerGun = this.add.image(this.player!.x, this.player!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    if (this.allyHasGun) {
      this.allyGun = this.add.image(this.ally!.x, this.ally!.y, 'weapon_gun').setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(GUN_DEPTH);
    }
    this.enemyGun = this.add.image(
      this.enemies[this.enemyGunIndex].x,
      this.enemies[this.enemyGunIndex].y,
      'weapon_gun',
    ).setDisplaySize(GUN_DISPLAY_W, GUN_DISPLAY_H).setDepth(ENEMY_GUN_DEPTH);

    this.roundScored = false;
    this.playerInvulnerable = false;
    this.allyInvulnerable = false;
    this.enemyInvulnerable = [false, false];
    this.lastPlayerShootTime = 0;
    this.lastEnemyShootTimes = [0, 0];
    this.lastAllyShootTime = 0;
    this.lastPlayerAttackTime = 0;
    this.isPlayerAttacking = false;
    this.enemyStuckSince = [-1, -1];
    this.enemyJumpStuckSince = [-1, -1];
    this.allyStuckSince = -1;
    this.allyJumpStuckSince = -1;
    this.startCountdown();
  }

  private createCharacterSprite(x: number, y: number, dinoKey: string): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    const sprite = this.physics.add.sprite(x, y, `dino_${dinoKey}`);
    sprite.setScale(2);
    sprite.setData('hp', HP_MAX);
    sprite.setData('invulnUntil', 0);
    sprite.setData('dinoKey', dinoKey);
    if (sprite.body) {
      sprite.refreshBody();
      sprite.body.setSize(14, 18);
      sprite.body.setOffset(5, 3);
    }
    if (this.platforms) {
      this.physics.add.collider(sprite, this.platforms, undefined, this.canCollideWithPlatform, this);
    }
    return sprite;
  }

  private createAllAnimations(): void {
    if (this.anims.exists('doux_hurt')) return;
    const dinoKeys = ['doux', 'mort', 'vita', 'tard'];
    for (const key of dinoKeys) {
      this.anims.create({
        key: `${key}_idle`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `${key}_run`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 4, end: 9 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: `${key}_attack`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 10, end: 12 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: `${key}_kick`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 10, end: 12 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: `${key}_hurt`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 13, end: 16 }),
        frameRate: 8,
        repeat: 0,
      });
      this.anims.create({
        key: `${key}_jump`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 4, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  private isAnimatingKickOrHurt(sprite: Phaser.GameObjects.Sprite, dinoKey: string): boolean {
    return sprite.anims.isPlaying &&
      (sprite.anims.currentAnim?.key === `${dinoKey}_kick` ||
        sprite.anims.currentAnim?.key === `${dinoKey}_hurt`);
  }

  private orbitGun(gun: Phaser.GameObjects.Image, x: number, y: number, angle: number): void {
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

      const dropStartY = enemy.getData('dropStartY');
      if (dropStartY !== undefined) {
        if (enemy.y > (dropStartY as number) + 2) {
          enemy.setData('dropStartY', undefined);
        } else {
          continue;
        }
      }

      const onGround = enemy.body?.blocked.down ?? false;
      const dinoKey = enemy.getData('dinoKey') as string;
      const hasGun = i === this.enemyGunIndex;

      enemy.setVelocityX(this.enemyDirections[i] * MOVE_SPEED);

      let target: Phaser.Physics.Arcade.Sprite | null = null;
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

      const { seekEdge, seekJump, newStuckSince, newJumpStuckSince } = this.updateStuckTimers(
        onGround, enemy.y, target.y,
        this.enemyStuckSince[i], this.enemyJumpStuckSince[i],
      );
      this.enemyStuckSince[i] = newStuckSince;
      this.enemyJumpStuckSince[i] = newJumpStuckSince;

      if (seekEdge) {
        if (onGround && target.y > enemy.y + HEIGHT_THRESHOLD_DOWN) {
          this.handleEdgeDropThrough(enemy, target.x);
        } else {
          const edgeDir = this.findClosestPlatformEdgeDir(enemy);
          if (onGround && !this.hasGroundAhead(enemy, edgeDir)) {
            this.handleEdgeDrop(enemy, edgeDir);
          } else {
            enemy.setVelocityX(edgeDir * MOVE_SPEED);
          }
          this.enemyDirections[i] = edgeDir;
        }
      } else if (seekJump) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        const moveDir = Math.cos(angle) > 0 ? 1 : -1;
        enemy.setVelocityX(Math.cos(angle) * MOVE_SPEED);
        enemy.setVelocityY(JUMP_VELOCITY);
        this.enemyDirections[i] = moveDir;
      } else if (hasGun) {
        if (!this.enemyGun) continue;
        const gun = this.enemyGun;
        const angle = Phaser.Math.Angle.Between(gun.x, gun.y, target.x, target.y);

        if (this.hasLineOfSight(gun.x, gun.y, target.x, target.y)) {
          enemy.setVelocityX(0);
          if (this.time.now > this.lastEnemyShootTimes[0] + SHOOT_COOLDOWN) {
            this.fireBullet(gun.x, gun.y, angle, 'enemy');
            this.lastEnemyShootTimes[0] = this.time.now;
          }
        } else {
          this.enemyDirections[0] = this.handlePlatformMovement(enemy, angle, target.y, onGround);
        }
      } else {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        this.enemyDirections[1] = this.handlePlatformMovement(enemy, angle, target.y, onGround);

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

      const eVx = enemy.body?.velocity.x ?? 0;
      if (eVx < 0) enemy.setFlipX(true);
      else if (eVx > 0) enemy.setFlipX(false);

      const eBusy = this.isAnimatingKickOrHurt(enemy, dinoKey);
      if (!eBusy) {
        if (!onGround) {
          enemy.play(`${dinoKey}_jump`, true);
        } else if (Math.abs(eVx) > 0) {
          enemy.play(`${dinoKey}_run`, true);
        } else {
          enemy.play(`${dinoKey}_idle`, true);
        }
      }
    }
  }

  private findClosestPlatformEdgeDir(sprite: Phaser.Physics.Arcade.Sprite): number {
    if (!this.platforms) return 1;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return 1;

    for (const child of this.platforms.getChildren()) {
      const platBody = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!platBody) continue;
      if (!(child as Phaser.GameObjects.Rectangle).visible) continue;
      if (body.x + body.width > platBody.x && body.x < platBody.x + platBody.width) {
        const platLeft = platBody.x;
        const platRight = platBody.x + platBody.width;
        const platCenterX = (platLeft + platRight) / 2;
        const toLeft = Math.abs(sprite.x - platLeft);
        const toRight = Math.abs(sprite.x - platRight);
        if (Math.abs(platCenterX - 400) < 20 || Math.abs(toLeft - toRight) < 10) {
          return Math.random() < 0.5 ? -1 : 1;
        }
        return sprite.x > 400 ? -1 : 1;
      }
    }
    return 1;
  }

  private hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.platforms) return true;
    const stepSize = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(Math.floor(dist / stepSize), 1);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = fromX + dx * t;
      const py = fromY + dy * t;
      if (this.isPointInAnyPlatform(px, py)) return false;
    }
    return true;
  }

  private isPointInAnyPlatform(x: number, y: number): boolean {
    if (!this.platforms) return false;
    for (const child of this.platforms.getChildren()) {
      const body = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!body) continue;
      if (x >= body.x && x <= body.x + body.width && y >= body.y && y <= body.y + body.height) {
        return true;
      }
    }
    return false;
  }

  private fireBullet(x: number, y: number, angle: number, owner: string): void {
    const bx = x + Math.cos(angle) * BULLET_OFFSET;
    const by = y + Math.sin(angle) * BULLET_OFFSET;
    const bullet = this.add.rectangle(bx, by, BULLET_SIZE, BULLET_SIZE, 0xffff00).setDepth(10);
    this.physics.add.existing(bullet, false);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
    bullet.setData('owner', owner);
    this.bullets?.add(bullet);
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

  private applyDamageTo(target: Phaser.Physics.Arcade.Sprite, dir: number, source?: string): void {
    if (!target.active) return;
    if (target === this.player && this.playerInvulnerable) return;
    if (target === this.ally && this.allyInvulnerable) return;
    const enemyIdx = this.enemies.indexOf(target as Phaser.Physics.Arcade.Sprite);
    if (enemyIdx >= 0 && this.enemyInvulnerable[enemyIdx]) return;

    const hp = target.getData('hp') as number;
    target.setData('hp', hp - 1);
    target.setVelocityX(dir * KNOCKBACK_VELOCITY_X);
    target.setVelocityY(JUMP_VELOCITY);

    const key = target.getData('dinoKey') as string;
    target.play(`${key}_hurt`);

    if (target === this.player) this.playerInvulnerable = true;
    else if (target === this.ally) this.allyInvulnerable = true;
    else if (enemyIdx >= 0) this.enemyInvulnerable[enemyIdx] = true;

    this.tweens.add({
      targets: target,
      alpha: { from: 1, to: 0.2 },
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        target.setAlpha(1);
      },
    });

    this.time.delayedCall(INVULN_DURATION, () => {
      if (target === this.player) this.playerInvulnerable = false;
      else if (target === this.ally) this.allyInvulnerable = false;
      else if (enemyIdx >= 0) this.enemyInvulnerable[enemyIdx] = false;
    });

    if (hp - 1 <= 0) {
      target.setActive(false).setVisible(false);
      const tb = target.body as Phaser.Physics.Arcade.Body;
      if (tb) {
        tb.setEnable(false);
        tb.setVelocity(0, 0);
      }

      this.destroyGunAndLabel(target);

      if (target === this.ally && source === 'player') {
        this.loyalty = Math.max(this.loyalty - LOYALTY_KILL_PENALTY, LOYALTY_MIN);
      }
      this.checkTeamElimination();
    }
  }

  private updateAllyFSM(): void {
    if (!this.ally || !this.ally.active) return;

    const allyDropStartY = this.ally.getData('dropStartY');
    if (allyDropStartY !== undefined) {
      if (this.ally.y > (allyDropStartY as number) + 2) {
        this.ally.setData('dropStartY', undefined);
      } else {
        return;
      }
    }

    let state: string;
    let color: string;

    if (this.loyalty > LOYALTY_FRIENDLY_THRESHOLD) {
      state = 'Aliado';
      color = '#00ff00';
    } else if (this.loyalty >= LOYALTY_HOSTILE_THRESHOLD) {
      state = '???';
      color = '#ffff00';
    } else {
      state = 'Hostil';
      color = '#ff0000';
    }

    if (state === '???') {
      this.ally.setVelocityX(0);
    }

    if (!this.player?.active && state === 'Hostil') {
      state = 'Aliado';
      color = '#00ff00';
    }

    if (state === 'Aliado') {
      let target: Phaser.Physics.Arcade.Sprite | null = null;
      let nearestDist = Infinity;
      for (const e of this.enemies) {
        if (e.active) {
          const d = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, e.x, e.y);
          if (d < nearestDist) {
            nearestDist = d;
            target = e;
          }
        }
      }
      if (!target) {
        this.ally.setVelocityX(0);
      } else {
        const { seekEdge, seekJump, newStuckSince, newJumpStuckSince } = this.updateStuckTimers(
          this.ally.body?.blocked.down ?? false, this.ally.y, target.y,
          this.allyStuckSince, this.allyJumpStuckSince,
        );
        this.allyStuckSince = newStuckSince;
        this.allyJumpStuckSince = newJumpStuckSince;

        if (seekEdge) {
          if (this.ally.body?.blocked.down && target.y > this.ally.y + HEIGHT_THRESHOLD_DOWN) {
            this.handleEdgeDropThrough(this.ally, target.x);
          } else {
            const edgeDir = this.findClosestPlatformEdgeDir(this.ally);
            if (this.ally.body?.blocked.down && !this.hasGroundAhead(this.ally, edgeDir)) {
              this.handleEdgeDrop(this.ally, edgeDir);
            } else {
              this.ally.setVelocityX(edgeDir * MOVE_SPEED);
            }
          }
        } else if (seekJump) {
          const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
          this.ally.setVelocityX(Math.cos(angle) * MOVE_SPEED);
          this.ally.setVelocityY(JUMP_VELOCITY);
        } else if (this.allyHasGun && this.allyGun) {
          const gx = this.allyGun.x;
          const gy = this.allyGun.y;
          const angle = this.allyGun.rotation;
          if (this.hasLineOfSight(gx, gy, target.x, target.y)) {
            this.ally.setVelocityX(0);
            if (this.time.now > this.lastAllyShootTime + SHOOT_COOLDOWN) {
              this.fireBullet(gx, gy, angle, 'ally');
              this.lastAllyShootTime = this.time.now;
            }
          } else {
            const moveAngle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
            this.handlePlatformMovement(this.ally, moveAngle, target.y, this.ally.body?.blocked.down ?? false);
          }
        } else {
          const dist = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, target.x, target.y);
          if (dist < MELEE_RANGE) {
            this.ally.setVelocityX(0);
            if (this.time.now > this.lastAllyShootTime + MELEE_COOLDOWN) {
              this.lastAllyShootTime = this.time.now;
              this.ally.play(`${this.allyDinoKey}_kick`);
              this.applyDamageTo(target, !this.ally.flipX ? 1 : -1, 'ally');
            }
          } else {
            const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
            this.handlePlatformMovement(this.ally, angle, target.y, this.ally.body?.blocked.down ?? false);
          }
          this.ally.setFlipX(this.ally.body?.velocity.x ? this.ally.body.velocity.x < 0 : this.ally.flipX);
        }
      }
    }

    if (state === 'Hostil') {
      if (!this.player?.active) {
        this.ally.setVelocityX(0);
      } else {
        const { seekEdge, seekJump, newStuckSince, newJumpStuckSince } = this.updateStuckTimers(
          this.ally.body?.blocked.down ?? false, this.ally.y, this.player.y,
          this.allyStuckSince, this.allyJumpStuckSince,
        );
        this.allyStuckSince = newStuckSince;
        this.allyJumpStuckSince = newJumpStuckSince;

        if (seekEdge) {
          if (this.ally.body?.blocked.down && this.player.y > this.ally.y + HEIGHT_THRESHOLD_DOWN) {
            this.handleEdgeDropThrough(this.ally, this.player.x);
          } else {
            const edgeDir = this.findClosestPlatformEdgeDir(this.ally);
            if (this.ally.body?.blocked.down && !this.hasGroundAhead(this.ally, edgeDir)) {
              this.handleEdgeDrop(this.ally, edgeDir);
            } else {
              this.ally.setVelocityX(edgeDir * MOVE_SPEED);
            }
          }
        } else if (seekJump) {
          const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
          this.ally.setVelocityX(Math.cos(angle) * MOVE_SPEED);
          this.ally.setVelocityY(JUMP_VELOCITY);
        } else if (this.allyHasGun && this.allyGun) {
          const gx = this.allyGun.x;
          const gy = this.allyGun.y;
          const angle = this.allyGun.rotation;
          if (this.hasLineOfSight(gx, gy, this.player.x, this.player.y)) {
            this.ally.setVelocityX(0);
            if (this.time.now > this.lastAllyShootTime + SHOOT_COOLDOWN) {
              this.fireBullet(gx, gy, angle, 'ally');
              this.lastAllyShootTime = this.time.now;
            }
          } else {
            const moveAngle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
            this.handlePlatformMovement(this.ally, moveAngle, this.player.y, this.ally.body?.blocked.down ?? false);
          }
        } else {
          const dist = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
          if (dist < MELEE_RANGE) {
            this.ally.setVelocityX(0);
            if (this.time.now > this.lastAllyShootTime + MELEE_COOLDOWN) {
              this.lastAllyShootTime = this.time.now;
              this.ally.play(`${this.allyDinoKey}_kick`);
              this.applyDamageTo(this.player, !this.ally.flipX ? 1 : -1, 'ally');
            }
          } else {
            const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
            this.handlePlatformMovement(this.ally, angle, this.player.y, this.ally.body?.blocked.down ?? false);
          }
          this.ally.setFlipX(this.ally.body?.velocity.x ? this.ally.body.velocity.x < 0 : this.ally.flipX);
        }
      }
    }

    const aBusy = this.ally.anims.isPlaying &&
      (this.ally.anims.currentAnim?.key === 'vita_kick' ||
        this.ally.anims.currentAnim?.key === `${this.allyDinoKey}_hurt`);
    if (!aBusy) {
      const allyVx = this.ally.body?.velocity.x ?? 0;
      if (Math.abs(allyVx) > 0) {
        this.ally.setFlipX(allyVx < 0);
        this.ally.play(`${this.allyDinoKey}_run`, true);
      } else {
        this.ally.play(`${this.allyDinoKey}_idle`, true);
      }
    }

    if (this.allyFSMText) {
      if (this.gameMode === '2players') {
        this.allyFSMText.setText('P2');
        this.allyFSMText.setColor('#00ffff');
      } else {
        const label = state === 'Aliado' ? 'CPU' : state === 'Hostil' ? 'Angry' : state;
        this.allyFSMText.setText(label);
        this.allyFSMText.setColor(color);
      }
      this.allyFSMText.setPosition(this.ally.x, this.ally.y - 30);
    }
  }

  private hasGroundAhead(sprite: Phaser.Physics.Arcade.Sprite, direction: number): boolean {
    if (!this.platforms) return false;

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return false;

    const sensorX = direction > 0 ? body.x + body.width : body.x - 4;
    const sensorY = body.y + body.height + 2;
    const sensorRect = new Phaser.Geom.Rectangle(sensorX, sensorY, 4, 4);

    const children = this.platforms.getChildren();
    for (const child of children) {
      const platBody = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!platBody) continue;

      const platRect = new Phaser.Geom.Rectangle(
        platBody.x, platBody.y,
        platBody.width, platBody.height,
      );

      if (Phaser.Geom.Rectangle.Overlaps(sensorRect, platRect)) {
        return true;
      }
    }
    return false;
  }

  private handleEdgeDrop(sprite: Phaser.Physics.Arcade.Sprite, moveDir: number): void {
    sprite.setData('dropStartY', sprite.y);
    sprite.setVelocityX(moveDir * MOVE_SPEED);
    sprite.setVelocityY(-EDGE_DROP_SPEED);
  }

  private updateStuckTimers(
    onGround: boolean,
    spriteY: number,
    targetY: number,
    stuckSince: number,
    jumpStuckSince: number,
  ): { seekEdge: boolean; seekJump: boolean; newStuckSince: number; newJumpStuckSince: number } {
    let seekEdge = false;
    if (onGround && targetY > spriteY + HEIGHT_THRESHOLD_DOWN) {
      if (stuckSince < 0) {
        stuckSince = this.time.now;
      } else if (this.time.now - stuckSince > STUCK_DELAY) {
        seekEdge = true;
      }
    } else {
      stuckSince = -1;
    }

    let seekJump = false;
    if (onGround && targetY < spriteY - HEIGHT_THRESHOLD_UP) {
      if (jumpStuckSince < 0) {
        jumpStuckSince = this.time.now;
      } else if (this.time.now - jumpStuckSince > JUMP_STUCK_DELAY) {
        seekJump = true;
      }
    } else {
      jumpStuckSince = -1;
    }

    return { seekEdge, seekJump, newStuckSince: stuckSince, newJumpStuckSince: jumpStuckSince };
  }

  private handleEdgeDropThrough(
    sprite: Phaser.Physics.Arcade.Sprite,
    targetX: number,
  ): void {
    sprite.setData('dropThrough', true);
    const dropDir = targetX > sprite.x ? 1 : -1;
    sprite.setVelocityX(dropDir * EDGE_DROP_SPEED);
    this.time.delayedCall(DROP_THROUGH_DELAY, () => {
      if (sprite.active) sprite.setData('dropThrough', false);
    });
  }

  private handlePlatformMovement(
    sprite: Phaser.Physics.Arcade.Sprite,
    angle: number,
    targetY: number,
    onGround: boolean,
  ): number {
    const moveDir = Math.cos(angle) > 0 ? 1 : -1;
    if (onGround && !this.hasGroundAhead(sprite, moveDir)) {
      if (this.hasPlatformInJumpRange(sprite, moveDir)) {
        sprite.setVelocityX(Math.cos(angle) * MOVE_SPEED);
        sprite.setVelocityY(JUMP_VELOCITY);
      } else if (targetY > sprite.y + HEIGHT_THRESHOLD_DOWN) {
        this.handleEdgeDrop(sprite, moveDir);
      } else {
        sprite.setData('edgePauseAt', undefined);
        sprite.setVelocityX(0);
      }
    } else {
      sprite.setData('edgePauseAt', undefined);
      sprite.setVelocityX(Math.cos(angle) * (targetY > sprite.y + HEIGHT_THRESHOLD_DOWN ? SPEED_BONUS_DOWN : MOVE_SPEED));
    }
    return moveDir;
  }

  private destroyGunAndLabel(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (sprite === this.player) {
      if (this.playerGun) { this.playerGun.destroy(); this.playerGun = null; }
      if (this.playerLabel) { this.playerLabel.setVisible(false); }
    }
    if (sprite === this.ally) {
      if (this.allyGun) { this.allyGun.destroy(); this.allyGun = null; }
      if (this.allyFSMText) { this.allyFSMText.setVisible(false); }
    }
    const enemyIdx = this.enemies.indexOf(sprite);
    if (enemyIdx >= 0 && enemyIdx === this.enemyGunIndex && this.enemyGun) {
      this.enemyGun.destroy();
      this.enemyGun = null;
    }
  }

  private checkFallDeath(): void {
    const killY = KILL_Y;
    const killSprite = (sprite: Phaser.Physics.Arcade.Sprite) => {
      if (!sprite.active) return;
      sprite.setActive(false).setVisible(false);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setEnable(false);
        body.setVelocity(0, 0);
      }
      this.destroyGunAndLabel(sprite);
    };

    if (this.player?.active && this.player.y > killY) killSprite(this.player);
    if (this.ally?.active && this.ally.y > killY) killSprite(this.ally);
    for (const enemy of this.enemies) {
      if (enemy.active && enemy.y > killY) killSprite(enemy);
    }
    this.checkTeamElimination();
  }

  private handleP1Input(): void {
    if (!this.player || !this.player.active) return;
    const onGround = this.player.body?.blocked.down ?? false;

    if (onGround && ((this.gameMode === '2players' ? this.cursors?.up.isDown : (this.keySpace?.isDown || this.cursors?.up.isDown)))) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }

    if (onGround && ((this.gameMode === '2players' ? this.cursors?.down.isDown : (this.keyS?.isDown || this.cursors?.down.isDown)))) {
      this.player.setData('dropThrough', true);
      this.player.setVelocityY(DROP_VELOCITY_Y);
      this.time.delayedCall(DROP_THROUGH_DELAY, () => {
        if (this.player?.active) this.player.setData('dropThrough', false);
      });
    }

    const pBusy = this.isAnimatingKickOrHurt(this.player, this.playerDinoKey);

    const moveLeft = this.gameMode === '2players' ? this.cursors?.left.isDown : (this.keyA?.isDown || this.cursors?.left.isDown);
    const moveRight = this.gameMode === '2players' ? this.cursors?.right.isDown : (this.keyD?.isDown || this.cursors?.right.isDown);

    if (moveLeft) {
      this.player.setVelocityX(-MOVE_SPEED);
      if (onGround && !pBusy) this.player.play(`${this.playerDinoKey}_run`, true);
    } else if (moveRight) {
      this.player.setVelocityX(MOVE_SPEED);
      if (onGround && !pBusy) this.player.play(`${this.playerDinoKey}_run`, true);
    } else {
      this.player.setVelocityX(0);
      if (onGround && !pBusy) this.player.play(`${this.playerDinoKey}_idle`, true);
    }

    const pVx = this.player.body?.velocity.x ?? 0;
    if (pVx < 0) this.player.setFlipX(true);
    else if (pVx > 0) this.player.setFlipX(false);

    if (!onGround && !pBusy) {
      this.player.play(`${this.playerDinoKey}_jump`, true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyF!) && this.time.now > this.lastPlayerAttackTime + MELEE_COOLDOWN) {
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
    if (!this.ally || !this.ally.active) return;
    const onGround = this.ally.body?.blocked.down ?? false;

    if (onGround && this.keySpace?.isDown) {
      this.ally.setVelocityY(JUMP_VELOCITY);
    }

    if (onGround && this.keyS?.isDown) {
      this.ally.setData('dropThrough', true);
      this.ally.setVelocityY(DROP_VELOCITY_Y);
      this.time.delayedCall(DROP_THROUGH_DELAY, () => {
        if (this.ally?.active) this.ally.setData('dropThrough', false);
      });
    }

    const aBusy = this.isAnimatingKickOrHurt(this.ally, this.allyDinoKey);

    if (this.keyA?.isDown) {
      this.ally.setVelocityX(-MOVE_SPEED);
      if (onGround && !aBusy) this.ally.play(`${this.allyDinoKey}_run`, true);
    } else if (this.keyD?.isDown) {
      this.ally.setVelocityX(MOVE_SPEED);
      if (onGround && !aBusy) this.ally.play(`${this.allyDinoKey}_run`, true);
    } else {
      this.ally.setVelocityX(0);
      if (onGround && !aBusy) this.ally.play(`${this.allyDinoKey}_idle`, true);
    }

    const aVx = this.ally.body?.velocity.x ?? 0;
    if (aVx < 0) this.ally.setFlipX(true);
    else if (aVx > 0) this.ally.setFlipX(false);

    if (!onGround && !aBusy) {
      this.ally.play(`${this.allyDinoKey}_jump`, true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyH!) && this.time.now > this.lastAllyShootTime + MELEE_COOLDOWN) {
      this.lastAllyShootTime = this.time.now;
      this.ally.play(`${this.allyDinoKey}_kick`);
      let target: Phaser.Physics.Arcade.Sprite | null = null;
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
      if (target && nearestDist < 40) {
        this.applyDamageTo(target, !this.ally.flipX ? 1 : -1, 'ally');
      }
    }
  }

  private hasPlatformInJumpRange(fromSprite: Phaser.Physics.Arcade.Sprite, direction: number): boolean {
    if (!this.platforms) return false;
    const fromBody = fromSprite.body as Phaser.Physics.Arcade.Body;
    if (!fromBody) return false;
    const feetY = fromBody.y + fromBody.height;
    const maxJumpUp = 140;
    const maxJumpHoriz = 280;

    for (const child of this.platforms.getChildren()) {
      const platBody = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!platBody) continue;

      const platTopY = platBody.y;
      const dy = feetY - platTopY;
      if (dy < 0 || dy > maxJumpUp) continue;

      const platLeftX = platBody.x;
      const platRightX = platBody.x + platBody.width;
      if (direction >= 0 && platRightX <= fromSprite.x) continue;
      if (direction <= 0 && platLeftX >= fromSprite.x) continue;

      const horizDist = direction >= 0 ? platLeftX - fromSprite.x : fromSprite.x - platRightX;
      if (horizDist > maxJumpHoriz) continue;

      return true;
    }
    return false;
  }

  private cleanupBullets(): void {
    this.bullets?.getChildren().forEach((b) => {
      const bullet = b as Phaser.GameObjects.Rectangle;
      if (bullet.x < -50 || bullet.x > 850 || bullet.y < -50 || bullet.y > 650) {
        bullet.destroy();
      }
    });
  }

  private canCollideWithPlatform(sprite: unknown, platform: unknown): boolean {
    if (this.roundFrozen) return true;

    const sObj = sprite as Phaser.GameObjects.GameObject;
    const pBody = (platform as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.StaticBody;
    if (!pBody) return false;
    const sBody = (sprite as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.Body;
    if (!sBody) return false;

    if (pBody.height > 20) return true;

    if (sObj.getData?.('dropThrough')) return false;

    return (sBody.y + sBody.height) <= (pBody.y + 16) && sBody.velocity.y >= -10;
  }

  private getRandomDinoKeys(exclude: string): string[] {
    const pool = ['doux', 'mort', 'tard', 'vita'];
    const available = pool.filter(k => k !== exclude);
    Phaser.Utils.Array.Shuffle(available);
    return available.slice(0, 3);
  }

  private setupStage(index: number): void {
    const bgKey = `bg_${index + 1}`;
    if (this.bgImage) {
      this.bgImage.destroy();
    }
    this.bgImage = this.add.image(400, 300, bgKey).setDisplaySize(800, 600).setScrollFactor(0).setDepth(-1);

    if (this.platforms) {
      this.platforms.clear(true, true);
    } else {
      this.platforms = this.physics.add.staticGroup();
    }

    const leftWall = this.add.rectangle(-10, 300, 20, 600).setVisible(false);
    this.platforms.add(leftWall);
    const rightWall = this.add.rectangle(810, 300, 20, 600).setVisible(false);
    this.platforms.add(rightWall);

    interface PlatformDef {
      x: number; y: number; w: number; h: number; color: number; stroke: number;
    }

    const layouts: PlatformDef[][] = [
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

    const stage = layouts[index];
    for (const plat of stage) {
      const rect = this.add.rectangle(plat.x, plat.y, plat.w, plat.h, plat.color);
      rect.setStrokeStyle(1, plat.stroke);
      this.platforms.add(rect);
    }
  }

  private getSpawnPosition(stageIndex: number, spawnIndex: number): { x: number; y: number } {
    const spawns: { x: number; y: number }[][] = [
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
    const stage = spawns[stageIndex] ?? spawns[0];
    return stage[spawnIndex] ?? stage[0];
  }
}
