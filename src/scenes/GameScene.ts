import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keySpace: Phaser.Input.Keyboard.Key | null = null;

  private enemies: Phaser.Physics.Arcade.Sprite[] = [];
  private enemyDirections: number[] = [1, -1];
  private ally: Phaser.Physics.Arcade.Sprite | null = null;
  private loyalty: number = 100;
  private allyFSMText: Phaser.GameObjects.Text | null = null;

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
        key: `${key}_jump`,
        frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 4, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    const enemySpawns = [
      { x: 80, y: 360 },
      { x: 720, y: 360 },
    ];

    for (let i = 0; i < enemySpawns.length; i++) {
      const spawn = enemySpawns[i];
      const enemy = this.physics.add.sprite(spawn.x, spawn.y, 'dino_mort');
      enemy.setScale(2);
      enemy.setCollideWorldBounds(true);

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
    }

    this.ally = this.physics.add.sprite(400, 180, 'dino_vita');
    this.ally.setScale(2);
    this.ally.setCollideWorldBounds(true);

    if (this.ally.body) {
      this.ally.refreshBody();
      this.ally.body.setSize(14, 18);
      this.ally.body.setOffset(5, 3);
    }

    if (this.ally && this.platforms) {
      this.physics.add.collider(this.ally, this.platforms);
    }

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

    this.updateAllyFSM();
    this.updateEnemyPatrol();
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

    if (this.allyFSMText) {
      this.allyFSMText.setText(state);
      this.allyFSMText.setColor(color);
      this.allyFSMText.setPosition(this.ally.x, this.ally.y - 30);
    }
  }

  private updateEnemyPatrol(): void {
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
}
