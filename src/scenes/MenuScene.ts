import Phaser from 'phaser';

const DINO_KEYS = ['vita', 'mort', 'tard', 'doux'];

const BG_W = 650;
const BG_H = 415;
const BG_X = 400;
const BG_Y = 325;
const QW = BG_W / 2;
const QH = BG_H / 2;

const QUADRANT_CENTERS = [
  { x: BG_X - QW / 2, y: BG_Y - QH / 2 },
  { x: BG_X + QW / 2, y: BG_Y - QH / 2 },
  { x: BG_X - QW / 2, y: BG_Y + QH / 2 },
  { x: BG_X + QW / 2, y: BG_Y + QH / 2 },
];

export class MenuScene extends Phaser.Scene {
  private selectedDino: string | null = null;
  private startButton!: Phaser.GameObjects.Image;
  private selectionHighlights: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.load.spritesheet('dino_doux', 'public/assets/dinos/DinoSprites - doux.png', { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('dino_mort', 'public/assets/dinos/DinoSprites - mort.png', { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('dino_tard', 'public/assets/dinos/DinoSprites - tard.png', { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('dino_vita', 'public/assets/dinos/DinoSprites - vita.png', { frameWidth: 24, frameHeight: 24 });

    this.load.image('menu_frame', 'public/assets/menu/frame.png');
    this.load.image('menu_bg', 'public/assets/menu/background-menu.jpg');
    this.load.image('menu_start', 'public/assets/menu/button.png');
  }

  create(): void {
    this.createAnimations();

    this.add.image(400, 300, 'menu_frame').setDisplaySize(800, 600);

    const bg = this.add.image(BG_X, BG_Y, 'menu_bg').setDisplaySize(BG_W, BG_H);
    this.createBgMask(bg);

    for (let i = 0; i < DINO_KEYS.length; i++) {
      const key = DINO_KEYS[i];
      const qc = QUADRANT_CENTERS[i];

      const sprite = this.add.sprite(qc.x, qc.y - 8, `dino_${key}`);
      sprite.setScale(4);
      sprite.play(`${key}_idle`);

      this.add.text(qc.x, qc.y + 65, key.toUpperCase(), {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      const hitZone = this.add.rectangle(qc.x, qc.y, QW, QH).setInteractive({ useHandCursor: true }).setAlpha(0.001);

      const highlight = this.add.rectangle(qc.x, qc.y, QW, QH).setStrokeStyle(0, 0xffffff).setFillStyle(undefined).setDepth(10);

      hitZone.on('pointerdown', () => this.selectDino(key, highlight));

      this.selectionHighlights.push(highlight);
    }

    this.startButton = this.add.image(400, 580, 'menu_start').setDepth(20).setInteractive({ useHandCursor: true }).setAlpha(0.4);

    this.startButton.on('pointerdown', () => {
      if (!this.selectedDino) return;
      this.startGame();
    });
  }

  private createBgMask(bg: Phaser.GameObjects.Image): void {
    const C = 16;
    const bx = BG_X - BG_W / 2;
    const by = BG_Y - BG_H / 2;
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffffff);
    g.beginPath();
    g.moveTo(bx, by + C);
    g.lineTo(bx + C, by);
    g.lineTo(bx + BG_W - C, by);
    g.lineTo(bx + BG_W, by + C);
    g.lineTo(bx + BG_W, by + BG_H - C);
    g.lineTo(bx + BG_W - C, by + BG_H);
    g.lineTo(bx + C, by + BG_H);
    g.lineTo(bx, by + BG_H - C);
    g.closePath();
    g.fillPath();
    bg.setMask(g.createGeometryMask());
  }

  private createAnimations(): void {
    for (const key of DINO_KEYS) {
      if (!this.anims.exists(`${key}_idle`)) {
        this.anims.create({
          key: `${key}_idle`,
          frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${key}_run`)) {
        this.anims.create({
          key: `${key}_run`,
          frames: this.anims.generateFrameNumbers(`dino_${key}`, { start: 4, end: 9 }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }
  }

  private selectDino(key: string, highlight: Phaser.GameObjects.Rectangle): void {
    this.selectedDino = key;

    for (const h of this.selectionHighlights) {
      h.setStrokeStyle(0, 0xffffff);
    }

    highlight.setStrokeStyle(4, 0xffffff);

    for (const dk of DINO_KEYS) {
      const sprite = this.children.list.find(
        c => c instanceof Phaser.GameObjects.Sprite && c.texture.key === `dino_${dk}`,
      ) as Phaser.GameObjects.Sprite | undefined;
      if (sprite) {
        sprite.play(`${dk}_idle`);
      }
    }

    const selSprite = this.children.list.find(
      c => c instanceof Phaser.GameObjects.Sprite && c.texture.key === `dino_${key}`,
    ) as Phaser.GameObjects.Sprite | undefined;
    if (selSprite) {
      selSprite.play(`${key}_run`);
    }

    this.startButton.setAlpha(1);
  }

  private startGame(): void {
    this.scene.start('GameScene', { playerDino: this.selectedDino });
  }
}
