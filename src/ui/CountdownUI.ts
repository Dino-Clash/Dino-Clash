import Phaser from 'phaser';
import { COUNTDOWN_INTERVAL } from '../config/GameConstants';

export class CountdownUI {
  private scene: Phaser.Scene;
  private onComplete: () => void;
  private overlay: Phaser.GameObjects.Rectangle;
  private countText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onComplete: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;

    this.overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.5).setDepth(200).setScrollFactor(0);
    this.countText = scene.add.text(400, 300, '', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

    this.start();
  }

  private start(): void {
    const numbers = ['3', '2', '1'];
    let index = 0;
    const tick = (): void => {
      if (index < numbers.length) {
        this.countText.setText(numbers[index]);
        index++;
        this.scene.time.delayedCall(COUNTDOWN_INTERVAL, tick);
      } else {
        this.destroy();
        this.onComplete();
      }
    };
    tick();
  }

  private destroy(): void {
    this.overlay.destroy();
    this.countText.destroy();
  }
}
