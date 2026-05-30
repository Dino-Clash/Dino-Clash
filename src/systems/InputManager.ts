import Phaser from 'phaser';
import type { GameMode } from '../config/GameConstants';

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keySpace: Phaser.Input.Keyboard.Key | null = null;
  private keyF: Phaser.Input.Keyboard.Key | null = null;
  private keyS: Phaser.Input.Keyboard.Key | null = null;
  private keyH: Phaser.Input.Keyboard.Key | null = null;
  private keyESC: Phaser.Input.Keyboard.Key | null = null;

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard?.createCursorKeys() ?? null;
    this.keyA = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) ?? null;
    this.keyD = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) ?? null;
    this.keySpace = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;
    this.keyF = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F) ?? null;
    this.keyS = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S) ?? null;
    this.keyH = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H) ?? null;
    this.keyESC = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? null;
  }

  isPausePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keyESC!);
  }

  isLeftP1(gameMode: GameMode): boolean {
    if (gameMode === '2players') return this.cursors?.left.isDown ?? false;
    return (this.keyA?.isDown || this.cursors?.left.isDown) ?? false;
  }

  isRightP1(gameMode: GameMode): boolean {
    if (gameMode === '2players') return this.cursors?.right.isDown ?? false;
    return (this.keyD?.isDown || this.cursors?.right.isDown) ?? false;
  }

  isJumpP1(gameMode: GameMode): boolean {
    if (gameMode === '2players') return this.cursors?.up.isDown ?? false;
    return (this.keySpace?.isDown || this.cursors?.up.isDown) ?? false;
  }

  isDropP1(gameMode: GameMode): boolean {
    if (gameMode === '2players') return this.cursors?.down.isDown ?? false;
    return (this.keyS?.isDown || this.cursors?.down.isDown) ?? false;
  }

  isMeleeP1(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keyF!);
  }

  isLeftP2(): boolean {
    return this.keyA?.isDown ?? false;
  }

  isRightP2(): boolean {
    return this.keyD?.isDown ?? false;
  }

  isJumpP2(): boolean {
    return this.keySpace?.isDown ?? false;
  }

  isDropP2(): boolean {
    return this.keyS?.isDown ?? false;
  }

  isMeleeP2(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keyH!);
  }
}
