import Phaser from 'phaser';
import { HP_MAX, INVULN_DURATION, KNOCKBACK_VELOCITY_X, JUMP_VELOCITY, DROP_VELOCITY_Y, DROP_THROUGH_DELAY, KILL_Y } from '../config/GameConstants';

export class DinoCharacter extends Phaser.Physics.Arcade.Sprite {
  public dinoKey: string;
  public hp: number = HP_MAX;
  public invulnerable: boolean = false;
  public dropThrough: boolean = false;
  public hasGun: boolean = false;
  public isAttacking: boolean = false;
  public dropStartY: number | undefined = undefined;
  public stuckSince: number = -1;
  public jumpStuckSince: number = -1;
  public meleeContactSince: number = -1;

  constructor(scene: Phaser.Scene, x: number, y: number, dinoKey: string) {
    super(scene, x, y, `dino_${dinoKey}`);
    this.dinoKey = dinoKey;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2);
    this.refreshBody();
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(14, 18);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(5, 3);
    }
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.setAlpha(1);
    this.setTexture(`dino_${this.dinoKey}`);
    this.hp = HP_MAX;
    this.invulnerable = false;
    this.dropThrough = false;
    this.isAttacking = false;
    this.dropStartY = undefined;
    this.stuckSince = -1;
    this.jumpStuckSince = -1;
    this.meleeContactSince = -1;

    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setEnable(true);
      body.setAllowGravity(true);
      body.setVelocity(0, 0);
    }
    this.refreshBody();
    if (body) {
      body.setSize(14, 18);
      body.setOffset(5, 3);
    }

    this.play(`${this.dinoKey}_idle`, true);
    this.setFlipX(false);
  }

  isOnGround(): boolean {
    return this.body?.blocked?.down ?? false;
  }

  get bodyArcade(): Phaser.Physics.Arcade.Body | null {
    return this.body as Phaser.Physics.Arcade.Body | null;
  }

  applyKnockback(dir: number): void {
    const body = this.bodyArcade;
    if (body) {
      body.setVelocityX(dir * KNOCKBACK_VELOCITY_X);
      body.setVelocityY(JUMP_VELOCITY);
    }
    this.play(`${this.dinoKey}_hurt`);
  }

  applyDamage(dir: number): boolean {
    if (!this.active || this.invulnerable) return false;

    this.hp -= 1;
    this.applyKnockback(dir);

    return true;
  }

  startInvulnerability(): void {
    this.invulnerable = true;
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.2 },
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (this.active) this.setAlpha(1);
      },
    });
    this.scene.time.delayedCall(INVULN_DURATION, () => {
      this.invulnerable = false;
    });
  }

  eliminate(): void {
    this.setActive(false).setVisible(false);
    const body = this.bodyArcade;
    if (body) {
      body.setEnable(false);
      body.setVelocity(0, 0);
    }
  }

  startDropThrough(): void {
    this.dropThrough = true;
    const body = this.bodyArcade;
    if (body) body.setVelocityY(DROP_VELOCITY_Y);
    this.scene.time.delayedCall(DROP_THROUGH_DELAY, () => {
      if (this.active) this.dropThrough = false;
    });
  }

  isAnimatingKickOrHurt(): boolean {
    return this.anims.isPlaying &&
      (this.anims.currentAnim?.key === `${this.dinoKey}_kick` ||
        this.anims.currentAnim?.key === `${this.dinoKey}_hurt`);
  }

  isFacingRight(): boolean {
    return !this.flipX;
  }

  faceDirection(velocityX: number): void {
    if (velocityX < 0) this.setFlipX(true);
    else if (velocityX > 0) this.setFlipX(false);
  }

  updateAnimation(velocityX: number): void {
    if (this.isAnimatingKickOrHurt()) return;
    if (!this.isOnGround()) {
      this.play(`${this.dinoKey}_jump`, true);
    } else if (Math.abs(velocityX) > 0) {
      this.play(`${this.dinoKey}_run`, true);
    } else {
      this.play(`${this.dinoKey}_idle`, true);
    }
  }

  hasFallenOffWorld(): boolean {
    return this.y > KILL_Y;
  }
}
