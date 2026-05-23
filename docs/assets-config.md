# Assets Configuration

## 1. Visual Asset Mapping

This document outlines the exact paths and texture keys for all graphical resources used in the game. These must be used within the Phaser `preload()` method.

### 1.1 Dinos (Spritesheets)
Each dinosaur spritesheet is structured with a frame size of 24x24 pixels.

- **Texture Key:** `dino_doux` | **Path:** `public/assets/dinos/DinoSprites - doux.png`
- **Texture Key:** `dino_mort` | **Path:** `public/assets/dinos/DinoSprites - mort.png`
- **Texture Key:** `dino_tard` | **Path:** `public/assets/dinos/DinoSprites - tard.png`
- **Texture Key:** `dino_vita` | **Path:** `public/assets/dinos/DinoSprites - vita.png`

### 1.2 Backgrounds (Images)
- **Texture Key:** `bg_1` | **Path:** `public/assets/backgrounds/background1.png`
- **Texture Key:** `bg_2` | **Path:** `public/assets/backgrounds/background2.png`
- **Texture Key:** `bg_3` | **Path:** `public/assets/backgrounds/background3.png`
- **Texture Key:** `bg_4` | **Path:** `public/assets/backgrounds/background4.png`
- **Texture Key:** `bg_5` | **Path:** `public/assets/backgrounds/background5.png`

### 1.3 Weapons (Images)
- **Texture Key:** `weapon_gun` | **Path:** `public/assets/weapon/gun.png`

### 1.4 Platforms (No Image Assets)
**CRITICAL NOTE FOR GAMEPLAY PROGRAMMER:** 
We will **NOT** use image assets for platforms. Static platforms must be rendered using geometric primitives (solid rectangles generated purely via code within the Arcade Physics engine).

---

## 2. Animation Frame Definitions

Assuming each frame is 24x24 pixels, the following arrays define the frame sequences for the main animations. The Gameplay Programmer must use these frame definitions when configuring the animation manager.

- **Idle:** Frames `[0, 1, 2, 3]`
- **Move (Run):** Frames `[4, 5, 6, 7, 8, 9]`
- **Attack (Kick):** Frames `[10, 11, 12]`
- **Hurt:** Frames `[13, 14, 15, 16]`
