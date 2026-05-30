import Phaser from 'phaser';
import { SCOREBOARD_Y, getDinoColor } from '../config/GameConstants';

export class ScoreboardUI {
  private scene: Phaser.Scene;
  private playerScoreText: Phaser.GameObjects.Text;
  private enemyScoreText: Phaser.GameObjects.Text;
  private playerScore: number = 0;
  private enemyScore: number = 0;

  constructor(scene: Phaser.Scene, playerDinoKey: string, enemyDinoKey: string) {
    this.scene = scene;
    const pColor = getDinoColor(playerDinoKey);
    const eColor = getDinoColor(enemyDinoKey);

    this.playerScoreText = scene.add.text(390, SCOREBOARD_Y, '0', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: pColor,
    }).setOrigin(1, 0).setDepth(100);

    scene.add.text(400, SCOREBOARD_Y, ' - ', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0).setDepth(100);

    this.enemyScoreText = scene.add.text(410, SCOREBOARD_Y, '0', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: eColor,
    }).setOrigin(0, 0).setDepth(100);
  }

  incrementPlayer(): void {
    this.playerScore++;
    this.scene.sound.play('coin_pickup', { volume: 0.3 });
    this.update();
  }

  incrementEnemy(): void {
    this.enemyScore++;
    this.scene.sound.play('coin_pickup', { volume: 0.3 });
    this.update();
  }

  private update(): void {
    this.playerScoreText.setText(String(this.playerScore));
    this.enemyScoreText.setText(String(this.enemyScore));
  }

  destroy(): void {
    this.playerScoreText.destroy();
    this.enemyScoreText.destroy();
  }
}
