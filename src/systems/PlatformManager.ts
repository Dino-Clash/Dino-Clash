import Phaser from 'phaser';
import { STAGE_LAYOUTS, STAGE_SPAWNS, MOVE_SPEED, EDGE_DROP_SPEED, SPEED_BONUS_DOWN, HEIGHT_THRESHOLD_DOWN, JUMP_VELOCITY, DROP_THROUGH_DELAY } from '../config/GameConstants';
import { DinoCharacter } from '../entities/DinoCharacter';

export class PlatformManager {
  private scene: Phaser.Scene;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  bgImage: Phaser.GameObjects.Image | null = null;
  private _roundFrozen: () => boolean = () => false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.platforms = scene.physics.add.staticGroup();
  }

  setRoundFrozenGetter(getter: () => boolean): void {
    this._roundFrozen = getter;
  }

  setupStage(index: number): void {
    const bgKey = `bg_${index + 1}`;
    if (this.bgImage) {
      this.bgImage.destroy();
    }
    this.bgImage = this.scene.add.image(400, 300, bgKey).setDisplaySize(800, 600).setScrollFactor(0).setDepth(-1);

    this.platforms.clear(true, true);

    const leftWall = this.scene.add.rectangle(-10, 300, 20, 600).setVisible(false);
    this.platforms.add(leftWall);
    const rightWall = this.scene.add.rectangle(810, 300, 20, 600).setVisible(false);
    this.platforms.add(rightWall);

    const stage = STAGE_LAYOUTS[index] ?? STAGE_LAYOUTS[0];
    for (const plat of stage) {
      const rect = this.scene.add.rectangle(plat.x, plat.y, plat.w, plat.h, plat.color);
      rect.setStrokeStyle(1, plat.stroke);
      this.platforms.add(rect);
    }
  }

  getSpawnPosition(stageIndex: number, spawnIndex: number): { x: number; y: number } {
    const stage = STAGE_SPAWNS[stageIndex] ?? STAGE_SPAWNS[0];
    return stage[spawnIndex] ?? stage[0];
  }

  hasGroundAhead(sprite: DinoCharacter, direction: number): boolean {
    const body = sprite.bodyArcade;
    if (!body) return false;

    const sensorX = direction > 0 ? body.x + body.width : body.x - 4;
    const sensorY = body.y + body.height + 2;
    const sensorRect = new Phaser.Geom.Rectangle(sensorX, sensorY, 4, 4);

    for (const child of this.platforms.getChildren()) {
      const platBody = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!platBody) continue;

      const platRect = new Phaser.Geom.Rectangle(platBody.x, platBody.y, platBody.width, platBody.height);
      if (Phaser.Geom.Rectangle.Overlaps(sensorRect, platRect)) {
        return true;
      }
    }
    return false;
  }

  hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
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

  isPointInAnyPlatform(x: number, y: number): boolean {
    for (const child of this.platforms.getChildren()) {
      const body = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!body) continue;
      if (x >= body.x && x <= body.x + body.width && y >= body.y && y <= body.y + body.height) {
        return true;
      }
    }
    return false;
  }

  findClosestPlatformEdgeDir(sprite: DinoCharacter): number {
    const body = sprite.bodyArcade;
    if (!body) return 1;

    for (const child of this.platforms.getChildren()) {
      const platBody = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!platBody) continue;
      if (!(child as Phaser.GameObjects.Rectangle).visible) continue;
      if (body.x + body.width > platBody.x && body.x < platBody.x + platBody.width) {
        const platLeft = platBody.x;
        const platRight = platBody.x + platBody.width;
        const platCenterX = (platLeft + platRight) / 2;
        const toLeft = Math.abs(sprite.x - platLeft);
        const toRight = Math.abs(sprite.x - platRight);
        if (Math.abs(platCenterX - 400) < 20 || Math.abs(toLeft - toRight) < 10) {
          return Math.random() < 0.5 ? -1 : 1;
        }
        return sprite.x > 400 ? -1 : 1;
      }
    }
    return 1;
  }

  hasPlatformInJumpRange(sprite: DinoCharacter, direction: number): boolean {
    const fromBody = sprite.bodyArcade;
    if (!fromBody) return false;
    const feetY = fromBody.y + fromBody.height;
    const maxJumpUp = 140;
    const maxJumpHoriz = 280;

    for (const child of this.platforms.getChildren()) {
      const platBody = (child as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      if (!platBody) continue;

      const platTopY = platBody.y;
      const dy = feetY - platTopY;
      if (dy < 0 || dy > maxJumpUp) continue;

      const platLeftX = platBody.x;
      const platRightX = platBody.x + platBody.width;
      if (direction >= 0 && platRightX <= sprite.x) continue;
      if (direction <= 0 && platLeftX >= sprite.x) continue;

      const horizDist = direction >= 0 ? platLeftX - sprite.x : sprite.x - platRightX;
      if (horizDist > maxJumpHoriz) continue;

      return true;
    }
    return false;
  }

  handleEdgeDrop(sprite: DinoCharacter, moveDir: number): void {
    sprite.dropStartY = sprite.y;
    const body = sprite.bodyArcade;
    if (body) {
      body.setVelocityX(moveDir * MOVE_SPEED);
      body.setVelocityY(-EDGE_DROP_SPEED);
    }
  }

  handleEdgeDropThrough(sprite: DinoCharacter, targetX: number): void {
    sprite.dropThrough = true;
    const dropDir = targetX > sprite.x ? 1 : -1;
    const body = sprite.bodyArcade;
    if (body) body.setVelocityX(dropDir * EDGE_DROP_SPEED);
    this.scene.time.delayedCall(DROP_THROUGH_DELAY, () => {
      if (sprite.active) sprite.dropThrough = false;
    });
  }

  handlePlatformMovement(sprite: DinoCharacter, angle: number, targetY: number, onGround: boolean): number {
    const moveDir = Math.cos(angle) > 0 ? 1 : -1;
    if (onGround && !this.hasGroundAhead(sprite, moveDir)) {
      if (this.hasPlatformInJumpRange(sprite, moveDir)) {
        const body = sprite.bodyArcade;
        if (body) {
          body.setVelocityX(Math.cos(angle) * MOVE_SPEED);
          body.setVelocityY(JUMP_VELOCITY);
        }
      } else if (targetY > sprite.y + HEIGHT_THRESHOLD_DOWN) {
        this.handleEdgeDrop(sprite, moveDir);
      } else {
        const body = sprite.bodyArcade;
        if (body) body.setVelocityX(0);
      }
    } else {
      const body = sprite.bodyArcade;
      if (body) {
        body.setVelocityX(Math.cos(angle) * (targetY > sprite.y + HEIGHT_THRESHOLD_DOWN ? SPEED_BONUS_DOWN : MOVE_SPEED));
      }
    }
    return moveDir;
  }

  canCollideWithPlatform(sprite: unknown, platform: unknown): boolean {
    if (this._roundFrozen()) return true;
    const pBody = (platform as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.StaticBody;
    if (!pBody) return false;
    const sObj = sprite as DinoCharacter;
    if (pBody.height > 20) return true;
    if (sObj.dropThrough) return false;
    const sBody = (sprite as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.Body;
    if (!sBody) return false;
    return (sBody.y + sBody.height) <= (pBody.y + 16) && sBody.velocity.y >= -10;
  }

  addCollider(sprite: DinoCharacter): void {
    this.scene.physics.add.collider(sprite, this.platforms, undefined, this.canCollideWithPlatform, this);
  }

  addColliderToBullets(bullets: Phaser.GameObjects.Group): void {
    this.scene.physics.add.collider(bullets, this.platforms, (bullet) => {
      (bullet as Phaser.GameObjects.Rectangle).destroy();
    });
  }

  destroy(): void {
    this.platforms.destroy();
    this.bgImage?.destroy();
  }
}
