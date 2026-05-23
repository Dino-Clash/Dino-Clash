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
  private enemyGuns: Phaser.GameObjects.Image[] = [];
  private enemyGroup: Phaser.GameObjects.Group | null = null;
  private lastEnemyShootTimes: number[] = [0, 0];

  private ally: Phaser.Physics.Arcade.Sprite | null = null;
  private allyGun: Phaser.GameObjects.Image | null = null;
  private loyalty: number = 100;
  private allyFSMText: Phaser.GameObjects.Text | null = null;

  private playerGun: Phaser.GameObjects.Image | null = null;
  private bullets: Phaser.Physics.Arcade.Group | null = null;

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

    const ground = this.add.rectangle(400, 584, 800, 32, 0x4a7023);
    ground.setStrokeStyle(1, 0x2d4a15);
    this.platforms.add(ground);

    const platMidLeft = this.add.rectangle(80, 396, 140, 16, 0x6b8e23);
    platMidLeft.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platMidLeft);

    const platMidRight = this.add.rectangle(720, 396, 140, 16, 0x6b8e23);
    platMidRight.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platMidRight);

    const platHigh = this.add.rectangle(400, 220, 140, 16, 0x8fbc3b);
    platHigh.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platHigh);

    this.player = this.physics.add.sprite(400, 100, 'dino_doux');
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);
    this.player.setData('hp', 3);
    this.player.setData('invulnUntil', 0);

    if (this.player.body) {
      this.player.refreshBody();
      this.player.body.setSize(14, 18);
      this.player.body.setOffset(5, 3);
    }

    if (this.player && this.platforms) {
      this.physics.add.collider(this.player, this.platforms);
    }

    const dinoKeys = ['doux', 'mort', 'vita'];
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
      const enemy = this.physics.add.sprite(spawn.x, spawn.y, 'dino_mort');
      enemy.setScale(2);
      enemy.setCollideWorldBounds(true);
      enemy.setData('hp', 3);
      enemy.setData('invulnUntil', 0);

      if (enemy.body) {
        enemy.refreshBody();
        enemy.body.setSize(14, 18);
        enemy.body.setOffset(5, 3);
      }

      if (this.platforms) {
        this.physics.add.collider(enemy, this.platforms);
      }

      enemy.setVelocityX(this.enemyDirections[i] * 150);
      this.enemies.push(enemy);
      this.enemyGroup.add(enemy);

      const gun = this.add.image(spawn.x, spawn.y, 'weapon_gun').setDepth(5);
      this.enemyGuns.push(gun);
    }

    this.ally = this.physics.add.sprite(400, 180, 'dino_vita');
    this.ally.setScale(2);
    this.ally.setCollideWorldBounds(true);
    this.ally.setData('hp', 3);
    this.ally.setData('invulnUntil', 0);

    if (this.ally.body) {
      this.ally.refreshBody();
      this.ally.body.setSize(14, 18);
      this.ally.body.setOffset(5, 3);
    }

    if (this.ally && this.platforms) {
      this.physics.add.collider(this.ally, this.platforms);
    }

    this.allyGun = this.add.image(400, 180, 'weapon_gun').setDepth(5);

    this.playerGun = this.add.image(400, 100, 'weapon_gun').setDepth(5);

    this.bullets = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.bullets, this.platforms, (bullet) => {
      (bullet as Phaser.GameObjects.Rectangle).destroy();
    });

    this.physics.add.overlap(this.bullets, this.player!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      if (b.getData('owner') !== 'enemy') return;
      this.applyDamageTo(this.player!, this.player!.x - b.x > 0 ? 1 : -1);
      b.destroy();
    });

    this.physics.add.overlap(this.bullets, this.ally!, (bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      if (b.getData('owner') !== 'enemy') return;
      this.applyDamageTo(this.ally!, this.ally!.x - b.x > 0 ? 1 : -1);
      b.destroy();
    });

    this.physics.add.overlap(this.bullets, this.enemyGroup!, (bullet, enemy) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      if (b.getData('owner') !== 'ally') return;
      this.applyDamageTo(enemy as Phaser.Physics.Arcade.Sprite, (enemy as Phaser.Physics.Arcade.Sprite).x - b.x > 0 ? 1 : -1);
      b.destroy();
    });

    this.allyFSMText = this.add.text(0, 0, 'Loyal', {
      fontSize: '12px',
      color: '#00ff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(10);

    this.player.play('doux_idle');
  }

  update(_time: number, _delta: number): void {
    if (!this.player || !this.player.active) return;

    const onGround = this.player.body?.blocked.down ?? false;

    if (onGround && (this.keySpace?.isDown || this.cursors?.up.isDown)) {
      this.player.setVelocityY(-600);
    }

    if (this.keyA?.isDown) {
      this.player.setVelocityX(-150);
      this.player.setFlipX(true);
      if (onGround) this.player.play('doux_run', true);
    } else if (this.keyD?.isDown) {
      this.player.setVelocityX(150);
      this.player.setFlipX(false);
      if (onGround) this.player.play('doux_run', true);
    } else {
      this.player.setVelocityX(0);
      if (onGround) this.player.play('doux_idle', true);
    }

    if (!onGround) {
      this.player.play('doux_jump', true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyF!) && this.time.now > this.lastPlayerAttackTime + 1000) {
      this.isPlayerAttacking = true;
      this.lastPlayerAttackTime = this.time.now;
      this.player.play('doux_attack');
    }

    if (this.isPlayerAttacking) {
      this.checkMeleeHit();
      this.isPlayerAttacking = false;
    }

    this.updateGuns();
    this.updateAllyFSM();
    this.updateEnemyCombat();
    this.cleanupBullets();
  }

  private updateGuns(): void {
    if (!this.playerGun || !this.player) return;
    const pointer = this.input.activePointer;
    const playerAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      pointer.worldX, pointer.worldY,
    );
    const radius = 22;
    this.playerGun.setPosition(
      this.player.x + Math.cos(playerAngle) * radius,
      this.player.y + Math.sin(playerAngle) * radius,
    );
    this.playerGun.setRotation(playerAngle);

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        this.enemyGuns[i].setVisible(false);
        continue;
      }
      const target = this.player;
      if (!target?.active) continue;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
      this.enemyGuns[i].setPosition(
        enemy.x + Math.cos(angle) * radius,
        enemy.y + Math.sin(angle) * radius,
      );
      this.enemyGuns[i].setRotation(angle);
      this.enemyGuns[i].setVisible(true);
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
      }
    }
  }

  private updateEnemyCombat(): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.active) continue;

      const onGround = enemy.body?.blocked.down ?? false;
      const dir = this.enemyDirections[i];

      if (onGround && !this.hasGroundAhead(enemy, dir)) {
        this.enemyDirections[i] *= -1;
        enemy.setVelocityX(this.enemyDirections[i] * 150);
      }

      enemy.setFlipX(this.enemyDirections[i] < 0);

      if (!onGround) {
        enemy.play('mort_jump', true);
      } else if (enemy.body?.velocity.x !== 0) {
        enemy.play('mort_run', true);
      } else {
        enemy.play('mort_idle', true);
      }

      const target = this.player;
      if (!target?.active) continue;

      const gun = this.enemyGuns[i];
      const angle = Phaser.Math.Angle.Between(gun.x, gun.y, target.x, target.y);

      if (
        this.time.now > this.lastEnemyShootTimes[i] + 2000 &&
        this.hasLineOfSight(gun.x, gun.y, target.x, target.y)
      ) {
        this.fireBullet(gun.x, gun.y, angle, 'enemy');
        this.lastEnemyShootTimes[i] = this.time.now;
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
    const bullet = this.add.rectangle(x, y, 8, 3, 0xffff00);
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
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const facingRight = !this.player.flipX;
    const ax = facingRight ? body.x + body.width : body.x - 20;
    const ay = body.y - 4;
    const attackRect = new Phaser.Geom.Rectangle(ax, ay, 20, body.height + 8);

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const eb = enemy.body as Phaser.Physics.Arcade.Body;
      if (!eb) continue;
      const enemyRect = new Phaser.Geom.Rectangle(eb.x, eb.y, eb.width, eb.height);
      if (Phaser.Geom.Rectangle.Overlaps(attackRect, enemyRect)) {
        this.applyDamageTo(enemy, facingRight ? 1 : -1);
      }
    }

    if (this.ally?.active) {
      const ab = this.ally.body as Phaser.Physics.Arcade.Body;
      if (ab) {
        const allyRect = new Phaser.Geom.Rectangle(ab.x, ab.y, ab.width, ab.height);
        if (Phaser.Geom.Rectangle.Overlaps(attackRect, allyRect)) {
          this.applyDamageTo(this.ally, facingRight ? 1 : -1);
          this.loyalty = Math.max(this.loyalty - 10, -100);
        }
      }
    }
  }

  private applyDamageTo(target: Phaser.Physics.Arcade.Sprite, dir: number): void {
    const hp = target.getData('hp') as number;
    const invulnUntil = target.getData('invulnUntil') as number;
    if (this.time.now < invulnUntil) return;

    target.setData('hp', hp - 1);
    target.setData('invulnUntil', this.time.now + 1000);
    target.setVelocityX(dir * 400);

    const key = target === this.player ? 'doux' : target === this.ally ? 'vita' : 'mort';
    target.play(`${key}_hurt`);

    if (hp - 1 <= 0) {
      target.setActive(false).setVisible(false);
      const tb = target.body as Phaser.Physics.Arcade.Body;
      if (tb) {
        tb.setEnable(false);
        tb.setVelocity(0, 0);
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

    if (state === 'Loyal') {
      const target = this.enemies.find(e => e.active);
      if (target) {
        const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
        this.ally.setVelocityX(Math.cos(angle) * 150);
      }
    }

    if (state === 'Hostile' && this.player?.active) {
      const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
      this.ally.setVelocityX(Math.cos(angle) * 150);
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

  private cleanupBullets(): void {
    this.bullets?.getChildren().forEach((b) => {
      const bullet = b as Phaser.GameObjects.Rectangle;
      if (bullet.x < -50 || bullet.x > 850 || bullet.y < -50 || bullet.y > 650) {
        bullet.destroy();
      }
    });
  }
}
