import Phaser from 'phaser';

export class PauseMenuUI {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle;
  private frame: Phaser.GameObjects.Image;
  private resumeButton: Phaser.GameObjects.Image;
  private menuButton: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, onResume: () => void, onMenu: () => void) {
    this.scene = scene;

    this.overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.6).setDepth(300).setScrollFactor(0);
    this.frame = scene.add.image(400, 300, 'menu_pausa').setScale(0.47).setDepth(301).setScrollFactor(0);

    const btnScale = 0.3;
    this.resumeButton = scene.add.image(400, 290, 'btn_resume').setScale(btnScale).setDepth(302).setScrollFactor(0).setInteractive({ useHandCursor: true });
    this.menuButton = scene.add.image(400, 365, 'btn_menu').setScale(btnScale).setDepth(302).setScrollFactor(0).setInteractive({ useHandCursor: true });

    const addHover = (btn: Phaser.GameObjects.Image) => {
      btn.on('pointerover', () => {
        scene.tweens.add({ targets: btn, scale: btnScale * 1.05, duration: 100, ease: 'Back.easeOut' });
      });
      btn.on('pointerout', () => {
        scene.tweens.add({ targets: btn, scale: btnScale, duration: 100, ease: 'Back.easeOut' });
      });
    };
    addHover(this.resumeButton);
    addHover(this.menuButton);

    this.resumeButton.on('pointerdown', () => {
      this.playClick();
      onResume();
    });

    this.menuButton.on('pointerdown', () => {
      this.playClick();
      onMenu();
    });
  }

  private playClick(): void {
    this.scene.sound.play('button_click', { volume: 0.5 });
  }

  destroy(): void {
    this.overlay.destroy();
    this.frame.destroy();
    this.resumeButton.destroy();
    this.menuButton.destroy();
  }
}
