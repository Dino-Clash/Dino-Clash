import Phaser from 'phaser';

interface DinoInfo {
  key: string;
  name: string;
  color: number;
}

const DINOS: DinoInfo[] = [
  { key: 'doux', name: 'DOUX', color: 0x0000ff },
  { key: 'mort', name: 'MORT', color: 0xff0000 },
  { key: 'tard', name: 'TARD', color: 0xffff00 },
  { key: 'vita', name: 'VITA', color: 0x00ff00 },
];

export class MenuScene extends Phaser.Scene {
  private selectedDino: string | null = null;
  private startButton!: Phaser.GameObjects.Text;
  private selectionBoxes: Phaser.GameObjects.Rectangle[] = [];
  private dinoSprites: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: 'MenuScene' });
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
  }

  create(): void {
    this.add.image(400, 300, 'bg_1').setDisplaySize(800, 600);

    this.add.text(400, 50, 'DINO CLASH', {
      fontSize: '44px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.createAnimations();

    const positions = [
      { x: 220, y: 210 },
      { x: 580, y: 210 },
      { x: 220, y: 380 },
      { x: 580, y: 380 },
    ];

    for (let i = 0; i < DINOS.length; i++) {
      const dino = DINOS[i];
      const pos = positions[i];

      const bg = this.add.rectangle(pos.x, pos.y, 200, 150, 0x222222)
        .setStrokeStyle(3, dino.color)
        .setInteractive({ useHandCursor: true });

      const sprite = this.add.sprite(pos.x, pos.y - 8, `dino_${dino.key}`);
      sprite.setScale(3);
      sprite.play(`${dino.key}_idle`);

      this.add.text(pos.x, pos.y + 58, dino.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectDino(dino.key));

      this.selectionBoxes.push(bg);
      this.dinoSprites.push(sprite);
    }

    this.startButton = this.add.text(400, 540, 'START', {
      fontSize: '32px',
      color: '#555555',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', () => {
      if (!this.selectedDino) return;
      this.startGame();
    });
  }

  private createAnimations(): void {
    for (const dino of DINOS) {
      if (!this.anims.exists(`${dino.key}_idle`)) {
        this.anims.create({
          key: `${dino.key}_idle`,
          frames: this.anims.generateFrameNumbers(`dino_${dino.key}`, { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${dino.key}_run`)) {
        this.anims.create({
          key: `${dino.key}_run`,
          frames: this.anims.generateFrameNumbers(`dino_${dino.key}`, { start: 4, end: 9 }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }
  }

  private selectDino(key: string): void {
    this.selectedDino = key;

    for (let i = 0; i < DINOS.length; i++) {
      this.selectionBoxes[i].setStrokeStyle(3, DINOS[i].color);
      this.dinoSprites[i].play(`${DINOS[i].key}_idle`);
    }

    const idx = DINOS.findIndex(d => d.key === key);
    this.selectionBoxes[idx].setStrokeStyle(4, 0xffffff);
    this.dinoSprites[idx].play(`${key}_run`);

    this.startButton.setColor('#ffffff');
  }

  private startGame(): void {
    this.scene.start('GameScene', { playerDino: this.selectedDino });
  }
}
