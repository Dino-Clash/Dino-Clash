import Phaser from 'phaser';
import { DinoCharacter } from '../entities/DinoCharacter';
import { PlatformManager } from '../systems/PlatformManager';
import { BulletManager } from '../systems/BulletManager';
import {
  LOYALTY_FRIENDLY_THRESHOLD, LOYALTY_HOSTILE_THRESHOLD,
  MOVE_SPEED, JUMP_VELOCITY, MELEE_RANGE, MELEE_COOLDOWN, SHOOT_COOLDOWN,
} from '../config/GameConstants';

export type AllyState = 'Loyal' | 'Doubtful' | 'Hostile';

export class AllyFSM {
  private scene: Phaser.Scene;
  private ally: DinoCharacter;
  private platformManager: PlatformManager;
  private bulletManager: BulletManager;
  private dinoKey: string;

  private stuckSince: number = -1;
  private jumpStuckSince: number = -1;
  private lastActionTime: number = 0;

  constructor(scene: Phaser.Scene, ally: DinoCharacter, platformManager: PlatformManager, bulletManager: BulletManager) {
    this.scene = scene;
    this.ally = ally;
    this.platformManager = platformManager;
    this.bulletManager = bulletManager;
    this.dinoKey = ally.dinoKey;
  }

  update(loyalty: number, player: DinoCharacter | null, enemies: DinoCharacter[], hasGun: boolean): AllyState {
    if (!this.ally.active) return 'Loyal';

    const dropStartY = this.ally.dropStartY;
    if (dropStartY !== undefined) {
      if (this.ally.y > dropStartY + 2) {
        this.ally.dropStartY = undefined;
      } else {
        return this.labelFor(loyalty, player);
      }
    }

    const state = this.determineState(loyalty, player);
    this.executeState(state, player, enemies, hasGun);
    this.updateAnimation();
    return state;
  }

  resetTimers(): void {
    this.stuckSince = -1;
    this.jumpStuckSince = -1;
    this.lastActionTime = 0;
  }

  private determineState(loyalty: number, player: DinoCharacter | null): AllyState {
    if (loyalty > LOYALTY_FRIENDLY_THRESHOLD) return 'Loyal';
    if (loyalty >= LOYALTY_HOSTILE_THRESHOLD) return 'Doubtful';
    if (!player?.active) return 'Loyal';
    return 'Hostile';
  }

  private labelFor(loyalty: number, player: DinoCharacter | null): AllyState {
    const raw = this.determineState(loyalty, player);
    if (raw === 'Doubtful') return 'Doubtful';
    return raw;
  }

  private executeState(state: AllyState, player: DinoCharacter | null, enemies: DinoCharacter[], hasGun: boolean): void {
    if (state === 'Doubtful') {
      this.ally.setVelocityX(0);
      return;
    }

    const target = state === 'Hostile' ? player : this.findNearest(enemies);
    if (!target?.active) {
      this.ally.setVelocityX(0);
      return;
    }

    this.navigateToward(target, hasGun);
  }

  private navigateToward(target: DinoCharacter, hasGun: boolean): void {
    const onGround = this.ally.isOnGround();
    const { seekEdge, seekJump } = this.updateStuckTimers(onGround, target.y);

    if (seekEdge) {
      this.handleSeekEdge(onGround, target);
    } else if (seekJump) {
      this.handleSeekJump(target);
    } else if (hasGun) {
      this.handleGunCombat(target);
    } else {
      this.handleMeleeCombat(target);
    }

    const vx = this.ally.bodyArcade?.velocity.x ?? 0;
    this.ally.faceDirection(vx);
  }

  private handleSeekEdge(onGround: boolean, target: DinoCharacter): void {
    if (onGround && target.y > this.ally.y + 30) {
      this.platformManager.handleEdgeDropThrough(this.ally, target.x);
    } else {
      const edgeDir = this.platformManager.findClosestPlatformEdgeDir(this.ally);
      if (onGround && !this.platformManager.hasGroundAhead(this.ally, edgeDir)) {
        this.platformManager.handleEdgeDrop(this.ally, edgeDir);
      } else {
        this.ally.bodyArcade?.setVelocityX(edgeDir * MOVE_SPEED);
      }
    }
  }

  private handleSeekJump(target: DinoCharacter): void {
    const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
    this.ally.bodyArcade?.setVelocityX(Math.cos(angle) * MOVE_SPEED);
    this.ally.bodyArcade?.setVelocityY(JUMP_VELOCITY);
  }

  private handleGunCombat(target: DinoCharacter): void {
    const gun = this.ally; // gun position follows ally center
    const angle = Phaser.Math.Angle.Between(gun.x, gun.y, target.x, target.y);
    if (this.platformManager.hasLineOfSight(gun.x, gun.y, target.x, target.y)) {
      this.ally.setVelocityX(0);
      if (this.scene.time.now > this.lastActionTime + SHOOT_COOLDOWN) {
        this.bulletManager.fireBullet(gun.x, gun.y, angle, 'ally');
        this.lastActionTime = this.scene.time.now;
      }
    } else {
      const moveAngle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
      this.platformManager.handlePlatformMovement(this.ally, moveAngle, target.y, this.ally.isOnGround());
    }
  }

  private handleMeleeCombat(target: DinoCharacter): void {
    const dist = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, target.x, target.y);
    if (dist < MELEE_RANGE) {
      this.ally.setVelocityX(0);
      if (this.scene.time.now > this.lastActionTime + MELEE_COOLDOWN) {
        this.lastActionTime = this.scene.time.now;
        this.ally.play(`${this.dinoKey}_kick`);
      }
    } else {
      const angle = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, target.x, target.y);
      this.platformManager.handlePlatformMovement(this.ally, angle, target.y, this.ally.isOnGround());
    }
  }

  private updateAnimation(): void {
    const busy = this.ally.isAnimatingKickOrHurt();
    if (busy) return;
    const vx = this.ally.bodyArcade?.velocity.x ?? 0;
    this.ally.updateAnimation(vx);
  }

  private findNearest(enemies: DinoCharacter[]): DinoCharacter | null {
    let nearest: DinoCharacter | null = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, e.x, e.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  private updateStuckTimers(onGround: boolean, targetY: number): { seekEdge: boolean; seekJump: boolean } {
    let seekEdge = false;
    let seekJump = false;

    if (onGround && targetY > this.ally.y + 30) {
      if (this.stuckSince < 0) {
        this.stuckSince = this.scene.time.now;
      } else if (this.scene.time.now - this.stuckSince > 1000) {
        seekEdge = true;
      }
    } else {
      this.stuckSince = -1;
    }

    if (onGround && targetY < this.ally.y - 40) {
      if (this.jumpStuckSince < 0) {
        this.jumpStuckSince = this.scene.time.now;
      } else if (this.scene.time.now - this.jumpStuckSince > 2000) {
        seekJump = true;
      }
    } else {
      this.jumpStuckSince = -1;
    }

    return { seekEdge, seekJump };
  }
}
