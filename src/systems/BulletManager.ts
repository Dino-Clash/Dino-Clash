import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_SIZE, BULLET_OFFSET } from '../config/GameConstants';

export class BulletManager {
  private scene: Phaser.Scene;
  bullets: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.add.group();
  }

  fireBullet(x: number, y: number, angle: number, owner: string): void {
    const bx = x + Math.cos(angle) * BULLET_OFFSET;
    const by = y + Math.sin(angle) * BULLET_OFFSET;
    const bullet = this.scene.add.rectangle(bx, by, BULLET_SIZE, BULLET_SIZE, 0xffff00).setDepth(10);
    this.scene.physics.add.existing(bullet, false);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
    bullet.setData('owner', owner);
    this.scene.sound.play('explosion', { volume: 0.3 });
    this.bullets.add(bullet);
  }

  cleanup(): void {
    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.GameObjects.Rectangle;
      if (bullet.x < -50 || bullet.x > 850 || bullet.y < -50 || bullet.y > 650) {
        bullet.destroy();
      }
    });
  }

  destroy(): void {
    this.bullets.destroy(true);
  }
}
