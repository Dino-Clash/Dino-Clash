import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keySpace: Phaser.Input.Keyboard.Key | null = null;
  private keyF: Phaser.Input.Keyboard.Key | null = null;

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

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.load.spritesheet(
      'dino_doux',
      'public/assets/dinos/DinoSprites - doux.png',
      { frameWidth: 24, frameHeight: 24 },
    );
    this.load.spritesheet(
      'dino_mort',
      'public/assets/dinos/DinoSprites - mort.png',
      { frameWidth: 24, frameHeight: 24 },
    );
    this.load.spritesheet(
      'dino_tard',
      'public/assets/dinos/DinoSprites - tard.png',
      { frameWidth: 24, frameHeight: 24 },
    );
    this.load.spritesheet(
      'dino_vita',
      'public/assets/dinos/DinoSprites - vita.png',
      { frameWidth: 24, frameHeight: 24 },
    );

    this.load.image('bg_1', 'public/assets/backgrounds/background1.png');
    this.load.image('bg_2', 'public/assets/backgrounds/background2.png');
    this.load.image('bg_3', 'public/assets/backgrounds/background3.png');
    this.load.image('bg_4', 'public/assets/backgrounds/background4.png');
    this.load.image('bg_5', 'public/assets/backgrounds/background5.png');

    this.load.image('weapon_gun', 'public/assets/weapon/gun.png');
  }

  create(): void {
    this.add.image(400, 300, 'bg_1');

    this.cursors = this.input.keyboard?.createCursorKeys() ?? null;
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) ?? null;
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) ?? null;
    this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;
    this.keyF = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F) ?? null;

    this.platforms = this.physics.add.staticGroup();

    const platBottomLeft = this.add.rectangle(150, 480, 200, 16, 0x4a7023);
    platBottomLeft.setStrokeStyle(1, 0x2d4a15);
    this.platforms.add(platBottomLeft);

    const platBottomRight = this.add.rectangle(650, 480, 200, 16, 0x4a7023);
    platBottomRight.setStrokeStyle(1, 0x2d4a15);
    this.platforms.add(platBottomRight);

    const platMidLeft = this.add.rectangle(80, 360, 160, 16, 0x6b8e23);
    platMidLeft.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platMidLeft);

    const platMidCenter = this.add.rectangle(400, 360, 160, 16, 0x6b8e23);
    platMidCenter.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platMidCenter);

    const platMidRight = this.add.rectangle(720, 360, 160, 16, 0x6b8e23);
    platMidRight.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platMidRight);

    const platUpperLeft = this.add.rectangle(150, 240, 160, 16, 0x8fbc3b);
    platUpperLeft.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platUpperLeft);

    const platUpperRight = this.add.rectangle(650, 240, 160, 16, 0x8fbc3b);
    platUpperRight.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platUpperRight);

    const platTop = this.add.rectangle(400, 120, 180, 16, 0x8fbc3b);
    platTop.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platTop);

    this.player = this.physics.add.sprite(400, 100, 'dino_doux');
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);
    this.player.setData('hp', 3);
    this.player.setData('invulnUntil', 0);
    this.player.setData('dinoKey', 'doux');

    if (this.player.body) {
      this.player.refreshBody();
      this.player.body.setSize(14, 18);
      this.player.body.setOffset(5, 3);
    }

    if (this.player && this.platforms) {
      this.physics.add.collider(this.player, this.platforms);
    }

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

    this.enemyGroup = this.add.group();

    const enemySpawns = [
      { x: 80, y: 360 },
      { x: 720, y: 360 },
    ];

    for (let i = 0; i < enemySpawns.length; i++) {
      const spawn = enemySpawns[i];
      const dinoName = i === 0 ? 'mort' : 'tard';
      const enemy = this.physics.add.sprite(spawn.x, spawn.y, `dino_${dinoName}`);
      enemy.setScale(2);
      enemy.setCollideWorldBounds(true);
      enemy.setData('hp', 3);
      enemy.setData('invulnUntil', 0);
      enemy.setData('dinoKey', dinoName);

      if (enemy.body) {
        enemy.refreshBody();
        enemy.body.setSize(14, 18);
        enemy.body.setOffset(5, 3);
      }

      if (this.platforms) {
        this.physics.add.collider(enemy, this.platforms);
      }

      enemy.setVelocityX(this.enemyDirections[i] * 300);
      this.enemies.push(enemy);
      this.enemyGroup.add(enemy);

    }

    this.enemyGunIndex = Phaser.Math.Between(0, 1);
    this.enemyGun = this.add.image(
      this.enemies[this.enemyGunIndex].x,
      this.enemies[this.enemyGunIndex].y,
      'weapon_gun',
    ).setDisplaySize(30, 22).setDepth(5);

    this.ally = this.physics.add.sprite(440, 100, 'dino_vita');
    this.ally.setScale(2);
    this.ally.setCollideWorldBounds(true);
    this.ally.setData('hp', 3);
    this.ally.setData('invulnUntil', 0);
    this.ally.setData('dinoKey', 'vita');

    if (this.ally.body) {
      this.ally.refreshBody();
      this.ally.body.setSize(14, 18);
      this.ally.body.setOffset(5, 3);
    }

    if (this.ally && this.platforms) {
      this.physics.add.collider(this.ally, this.platforms);
    }

    const playerGetsGun = Math.random() < 0.5;
    this.playerHasGun = playerGetsGun;
    this.allyHasGun = !playerGetsGun;

    if (this.playerHasGun) {
      this.playerGun = this.add.image(this.player!.x, this.player!.y, 'weapon_gun').setDisplaySize(30, 22).setDepth(5);
    }
    if (this.allyHasGun) {
      this.allyGun = this.add.image(this.ally!.x, this.ally!.y, 'weapon_gun').setDisplaySize(30, 22).setDepth(5);
    }

    this.bullets = this.add.group();

    this.physics.add.collider(this.bullets!, this.platforms, (bullet) => {
      (bullet as Phaser.GameObjects.Rectangle).destroy();
    });

    this.physics.add.overlap(this.bullets!, this.player!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      if (b.getData('owner') !== 'enemy') return;
      this.applyDamageTo(this.player!, this.player!.x - b.x > 0 ? 1 : -1);
      b.destroy();
    });

    this.physics.add.overlap(this.bullets!, this.ally!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner !== 'enemy' && owner !== 'player') return;
      this.applyDamageTo(this.ally!, this.ally!.x - b.x > 0 ? 1 : -1);
      b.destroy();
    });

    this.physics.add.overlap(this.bullets!, this.enemyGroup!, (bullet, enemy) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      const owner = b.getData('owner') as string;
      if (owner !== 'ally' && owner !== 'player') return;
      const sp = enemy as Phaser.Physics.Arcade.Sprite;
      this.applyDamageTo(sp, sp.x - b.x > 0 ? 1 : -1);
      b.destroy();
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return;
      if (this.playerHasGun && this.playerGun) {
        if (this.time.now > this.lastPlayerShootTime + 2000) {
          const angle = this.playerGun.rotation;
          this.fireBullet(this.playerGun.x, this.playerGun.y, angle, 'player');
          this.lastPlayerShootTime = this.time.now;
        }
      } else {
        if (this.time.now > this.lastPlayerAttackTime + 1000) {
          this.isPlayerAttacking = true;
          this.lastPlayerAttackTime = this.time.now;
          this.player!.play('doux_kick');
        }
      }
    });

    this.allyFSMText = this.add.text(0, 0, 'Loyal', {
      fontSize: '12px',
      color: '#00ff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(10);

    this.player.play('doux_idle');
  }

  update(_time: number, _delta: number): void {
    if (this.player && this.player.active) {
      const onGround = this.player.body?.blocked.down ?? false;

      if (onGround && (this.keySpace?.isDown || this.cursors?.up.isDown)) {
        this.player.setVelocityY(-600);
      }

      const pBusy = this.player.anims.isPlaying &&
        (this.player.anims.currentAnim?.key === 'doux_kick' ||
         this.player.anims.currentAnim?.key === 'doux_hurt');

      if (this.keyA?.isDown) {
        this.player.setVelocityX(-300);
        if (onGround && !pBusy) this.player.play('doux_run', true);
      } else if (this.keyD?.isDown) {
        this.player.setVelocityX(300);
        if (onGround && !pBusy) this.player.play('doux_run', true);
      } else {
        this.player.setVelocityX(0);
        if (onGround && !pBusy) this.player.play('doux_idle', true);
      }

      const pVx = this.player.body?.velocity.x ?? 0;
      if (pVx < 0) this.player.setFlipX(true);
      else if (pVx > 0) this.player.setFlipX(false);

      if (!onGround && !pBusy) {
        this.player.play('doux_jump', true);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyF!) && this.time.now > this.lastPlayerAttackTime + 1000) {
        this.isPlayerAttacking = true;
        this.lastPlayerAttackTime = this.time.now;
        this.player.play('doux_kick');
      }

      if (this.isPlayerAttacking) {
        this.checkMeleeHit();
        this.isPlayerAttacking = false;
      }
    }

    this.updateGuns();
    this.updateAllyFSM();
    this.updateEnemyCombat();
    this.cleanupBullets();
    this.checkFallDeath();
  }

  private updateGuns(): void {
    const radius = 22;

    if (this.enemyGun && this.enemyGunIndex >= 0 && this.enemies[this.enemyGunIndex]?.active) {
      const enemy = this.enemies[this.enemyGunIndex];
      const target = this.player?.active ? this.player : (this.ally?.active ? this.ally : null);
      if (!target) return;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
      this.enemyGun.setPosition(
        enemy.x + Math.cos(angle) * radius,
        enemy.y + Math.sin(angle) * radius,
      );
      this.enemyGun.setRotation(angle);
      this.enemyGun.setFlipY(Math.abs(angle) > Math.PI / 2);
      this.enemyGun.setVisible(true);
    }

    if (this.allyGun && this.ally?.active) {
      const target =
        this.loyalty < -20 ? this.player :
          this.enemies.find(e => e.active) ?? this.player;
      if (target?.active) {
        const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
        this.allyGun.setPosition(
          this.ally.x + Math.cos(angle) * radius,
          this.ally.y + Math.sin(angle) * radius,
        );
        this.allyGun.setRotation(angle);
        this.allyGun.setFlipY(Math.abs(angle) > Math.PI / 2);
      }
    }

    if (this.playerGun && this.player?.active) {
      const pointer = this.input.activePointer;
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
      this.playerGun.setPosition(
        this.player.x + Math.cos(angle) * 28,
        this.player.y + Math.sin(angle) * 28,
      );
      this.playerGun.setRotation(angle);
      this.playerGun.setFlipY(Math.abs(angle) > Math.PI / 2);
    }
  }

  private updateEnemyCombat(): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.active) continue;

      const onGround = enemy.body?.blocked.down ?? false;
      const dir = this.enemyDirections[i];
      const dinoKey = enemy.getData('dinoKey') as string;
      const hasGun = i === this.enemyGunIndex;

      if (onGround && !this.hasGroundAhead(enemy, dir)) {
        this.enemyDirections[i] *= -1;
        enemy.setVelocityX(this.enemyDirections[i] * 300);
      } else {
        enemy.setVelocityX(this.enemyDirections[i] * 300);
      }

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

      if (hasGun) {
        if (!this.enemyGun) continue;
        const gun = this.enemyGun;
        const angle = Phaser.Math.Angle.Between(gun.x, gun.y, target.x, target.y);

        if (this.hasLineOfSight(gun.x, gun.y, target.x, target.y)) {
          enemy.setVelocityX(0);
          if (this.time.now > this.lastEnemyShootTimes[0] + 2000) {
            this.fireBullet(gun.x, gun.y, angle, 'enemy');
            this.lastEnemyShootTimes[0] = this.time.now;
          }
        } else {
          const moveDirGun = Math.cos(angle) > 0 ? 1 : -1;
          if (onGround && !this.hasGroundAhead(enemy, moveDirGun)) {
            if (this.hasPlatformInJumpRange(enemy, moveDirGun)) {
              enemy.setVelocityX(Math.cos(angle) * 300);
              enemy.setVelocityY(-600);
            } else {
              enemy.setVelocityX(0);
            }
          } else {
            enemy.setVelocityX(Math.cos(angle) * 300);
          }
          this.enemyDirections[0] = moveDirGun;
        }
      } else {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        const moveDirMelee = Math.cos(angle) > 0 ? 1 : -1;
        if (onGround && !this.hasGroundAhead(enemy, moveDirMelee)) {
          if (this.hasPlatformInJumpRange(enemy, moveDirMelee)) {
            enemy.setVelocityX(Math.cos(angle) * 300);
            enemy.setVelocityY(-600);
          } else {
            enemy.setVelocityX(0);
          }
        } else {
          enemy.setVelocityX(Math.cos(angle) * 300);
        }
        this.enemyDirections[1] = moveDirMelee;

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
        if (dist < 40) {
          enemy.setVelocityX(0);
          if (this.time.now > this.lastEnemyShootTimes[1] + 1000) {
            this.lastEnemyShootTimes[1] = this.time.now;
            enemy.play(`${dinoKey}_kick`);
            this.applyDamageTo(target, !enemy.flipX ? 1 : -1);
          }
        }
      }

      const eVx = enemy.body?.velocity.x ?? 0;
      if (eVx < 0) enemy.setFlipX(true);
      else if (eVx > 0) enemy.setFlipX(false);

      const eBusy = enemy.anims.isPlaying &&
        (enemy.anims.currentAnim?.key === `${dinoKey}_kick` ||
         enemy.anims.currentAnim?.key === `${dinoKey}_hurt`);
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
    const bx = x + Math.cos(angle) * 15;
    const by = y + Math.sin(angle) * 15;
    const bullet = this.add.rectangle(bx, by, 8, 4, 0xffff00).setDepth(10);
    this.physics.add.existing(bullet, false);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    const speed = 800;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setData('owner', owner);
    this.bullets?.add(bullet);
  }

  private checkMeleeHit(): void {
    if (!this.player?.active) return;
    const facingRight = !this.player.flipX;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 40) {
        const inFront = facingRight ? enemy.x > this.player.x : enemy.x < this.player.x;
        if (inFront) this.applyDamageTo(enemy, facingRight ? 1 : -1);
      }
    }

    if (this.ally?.active) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ally.x, this.ally.y);
      if (dist < 40) {
        const inFront = facingRight ? this.ally.x > this.player.x : this.ally.x < this.player.x;
        if (inFront) {
          this.applyDamageTo(this.ally, facingRight ? 1 : -1);
          this.loyalty = Math.max(this.loyalty - 10, -100);
        }
      }
    }
  }

  private applyDamageTo(target: Phaser.Physics.Arcade.Sprite, dir: number): void {
    if (target === this.player && this.playerInvulnerable) return;
    if (target === this.ally && this.allyInvulnerable) return;
    const enemyIdx = this.enemies.indexOf(target as Phaser.Physics.Arcade.Sprite);
    if (enemyIdx >= 0 && this.enemyInvulnerable[enemyIdx]) return;

    const hp = target.getData('hp') as number;
    target.setData('hp', hp - 1);
    target.setVelocityX(dir * 400);

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

    this.time.delayedCall(1000, () => {
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

      if (target === this.player && this.playerGun) {
        this.playerGun.destroy();
        this.playerGun = null;
      }
      if (target === this.ally && this.allyGun) {
        this.allyGun.destroy();
        this.allyGun = null;
      }
      if (enemyIdx >= 0 && enemyIdx === this.enemyGunIndex && this.enemyGun) {
        this.enemyGun.destroy();
        this.enemyGun = null;
      }

      if (target === this.ally) {
        this.loyalty = Math.max(this.loyalty - 25, -100);
      }
    }
  }

  private updateAllyFSM(): void {
    if (!this.ally || !this.ally.active) return;

    let state: string;
    let color: string;

    if (this.loyalty > 20) {
      state = 'Loyal';
      color = '#00ff00';
    } else if (this.loyalty >= -20) {
      state = 'Inactive';
      color = '#ffff00';
    } else {
      state = 'Hostile';
      color = '#ff0000';
    }

    if (state === 'Inactive') {
      this.ally.setVelocityX(0);
    }

    if (!this.player?.active && state === 'Hostile') {
      state = 'Loyal';
      color = '#00ff00';
    }

    if (state === 'Loyal') {
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
      } else if (this.allyHasGun && this.allyGun) {
        const gx = this.allyGun.x;
        const gy = this.allyGun.y;
        const angle = this.allyGun.rotation;
        if (this.hasLineOfSight(gx, gy, target.x, target.y)) {
          this.ally.setVelocityX(0);
          if (this.time.now > this.lastAllyShootTime + 2000) {
            this.fireBullet(gx, gy, angle, 'ally');
            this.lastAllyShootTime = this.time.now;
          }
        } else {
          const moveAngle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
          const moveDirAlly = Math.cos(moveAngle) > 0 ? 1 : -1;
          if (this.ally.body?.blocked.down && !this.hasGroundAhead(this.ally, moveDirAlly)) {
            if (this.hasPlatformInJumpRange(this.ally, moveDirAlly)) {
              this.ally.setVelocityX(Math.cos(moveAngle) * 300);
              this.ally.setVelocityY(-600);
            } else {
              this.ally.setVelocityX(0);
            }
          } else {
            this.ally.setVelocityX(Math.cos(moveAngle) * 300);
          }
        }
      } else {
        const dist = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, target.x, target.y);
        if (dist < 40) {
          this.ally.setVelocityX(0);
          if (this.time.now > this.lastAllyShootTime + 1000) {
            this.lastAllyShootTime = this.time.now;
            this.ally.play('vita_kick');
            this.applyDamageTo(target, !this.ally.flipX ? 1 : -1);
          }
        } else {
          const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
          const moveDirAlly = Math.cos(angle) > 0 ? 1 : -1;
          if (this.ally.body?.blocked.down && !this.hasGroundAhead(this.ally, moveDirAlly)) {
            if (this.hasPlatformInJumpRange(this.ally, moveDirAlly)) {
              this.ally.setVelocityX(Math.cos(angle) * 300);
              this.ally.setVelocityY(-600);
            } else {
              this.ally.setVelocityX(0);
            }
          } else {
            this.ally.setVelocityX(Math.cos(angle) * 300);
          }
        }
        this.ally.setFlipX(this.ally.body?.velocity.x ? this.ally.body.velocity.x < 0 : this.ally.flipX);
      }
    }

    if (state === 'Hostile') {
      if (!this.player?.active) {
        this.ally.setVelocityX(0);
      } else if (this.allyHasGun && this.allyGun) {
        const gx = this.allyGun.x;
        const gy = this.allyGun.y;
        const angle = this.allyGun.rotation;
        if (this.hasLineOfSight(gx, gy, this.player.x, this.player.y)) {
          this.ally.setVelocityX(0);
          if (this.time.now > this.lastAllyShootTime + 2000) {
            this.fireBullet(gx, gy, angle, 'ally');
            this.lastAllyShootTime = this.time.now;
          }
        } else {
          const moveAngle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
          const moveDirAlly = Math.cos(moveAngle) > 0 ? 1 : -1;
          if (this.ally.body?.blocked.down && !this.hasGroundAhead(this.ally, moveDirAlly)) {
            if (this.hasPlatformInJumpRange(this.ally, moveDirAlly)) {
              this.ally.setVelocityX(Math.cos(moveAngle) * 300);
              this.ally.setVelocityY(-600);
            } else {
              this.ally.setVelocityX(0);
            }
          } else {
            this.ally.setVelocityX(Math.cos(moveAngle) * 300);
          }
        }
      } else {
        const dist = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
        if (dist < 40) {
          this.ally.setVelocityX(0);
          if (this.time.now > this.lastAllyShootTime + 1000) {
            this.lastAllyShootTime = this.time.now;
            this.ally.play('vita_kick');
            this.applyDamageTo(this.player, !this.ally.flipX ? 1 : -1);
          }
        } else {
          const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
          const moveDirAlly = Math.cos(angle) > 0 ? 1 : -1;
          if (this.ally.body?.blocked.down && !this.hasGroundAhead(this.ally, moveDirAlly)) {
            if (this.hasPlatformInJumpRange(this.ally, moveDirAlly)) {
              this.ally.setVelocityX(Math.cos(angle) * 300);
              this.ally.setVelocityY(-600);
            } else {
              this.ally.setVelocityX(0);
            }
          } else {
            this.ally.setVelocityX(Math.cos(angle) * 300);
          }
        }
        this.ally.setFlipX(this.ally.body?.velocity.x ? this.ally.body.velocity.x < 0 : this.ally.flipX);
      }
    }

    const aBusy = this.ally.anims.isPlaying &&
      (this.ally.anims.currentAnim?.key === 'vita_kick' ||
       this.ally.anims.currentAnim?.key === 'vita_hurt');
    if (!aBusy) {
      const allyVx = this.ally.body?.velocity.x ?? 0;
      if (Math.abs(allyVx) > 0) {
        this.ally.setFlipX(allyVx < 0);
        this.ally.play('vita_run', true);
      } else {
        this.ally.play('vita_idle', true);
      }
    }

    if (this.allyFSMText) {
      this.allyFSMText.setText(state);
      this.allyFSMText.setColor(color);
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

  private checkFallDeath(): void {
    const killY = 650;
    const killSprite = (sprite: Phaser.Physics.Arcade.Sprite) => {
      if (!sprite.active) return;
      sprite.setActive(false).setVisible(false);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setEnable(false);
        body.setVelocity(0, 0);
      }
      if (sprite === this.player && this.playerGun) {
        this.playerGun.destroy();
        this.playerGun = null;
      }
      if (sprite === this.ally && this.allyGun) {
        this.allyGun.destroy();
        this.allyGun = null;
      }
      const enemyIdx = this.enemies.indexOf(sprite);
      if (enemyIdx >= 0 && enemyIdx === this.enemyGunIndex && this.enemyGun) {
        this.enemyGun.destroy();
        this.enemyGun = null;
      }
    };

    if (this.player?.active && this.player.y > killY) killSprite(this.player);
    if (this.ally?.active && this.ally.y > killY) killSprite(this.ally);
    for (const enemy of this.enemies) {
      if (enemy.active && enemy.y > killY) killSprite(enemy);
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
}
