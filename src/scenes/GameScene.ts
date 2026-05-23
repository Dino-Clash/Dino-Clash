import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keySpace: Phaser.Input.Keyboard.Key | null = null;

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

    const platLeft = this.add.rectangle(150, 440, 160, 16, 0x6b8e23);
    platLeft.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platLeft);

    const platCenter = this.add.rectangle(400, 340, 192, 16, 0x6b8e23);
    platCenter.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platCenter);

    const platRight = this.add.rectangle(650, 440, 160, 16, 0x6b8e23);
    platRight.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platRight);

    const platHigh = this.add.rectangle(300, 250, 128, 16, 0x8fbc3b);
    platHigh.setStrokeStyle(1, 0x4a7023);
    this.platforms.add(platHigh);

    this.player = this.physics.add.sprite(400, 100, 'dino_doux');
    this.player.setScale(4);
    this.player.setCollideWorldBounds(true);

    if (this.player.body) {
      this.player.refreshBody();
    }

    if (this.player && this.platforms) {
      this.physics.add.collider(this.player, this.platforms);
    }

    this.anims.create({
      key: 'doux_idle',
      frames: this.anims.generateFrameNumbers('dino_doux', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'doux_run',
      frames: this.anims.generateFrameNumbers('dino_doux', { start: 4, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'doux_jump',
      frames: this.anims.generateFrameNumbers('dino_doux', { start: 4, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });

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
  }
}
