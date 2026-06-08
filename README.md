<div align="center">

# 🦖 Dino Clash

**2v2 platform fighter built with Phaser 4 + TypeScript**

![Phaser 4](https://img.shields.io/badge/Phaser-4.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)

</div>

---

## What is this?

Dino Clash is a 2v2 platform fighter where dinosaurs fight on platform stages. Each round, teams fight until one side is fully eliminated. The winning team scores a point, roles are reshuffled, the stage rotates, and a new round begins.

The twist? Your AI ally has a **loyalty meter** — shoot them enough times and they'll turn on you.

---

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

---

## Characters

| Dino | Color |
|------|-------|
| Doux | Blue |
| Mort | Red |
| Tard | Yellow |
| Vita | Green |

Each round, one member per team gets a **gun** (ranged), the other fights **melee**. Roles are random per round.

---

## Controls

| Action | 1 Player | 2 Players (P1 / P2) |
|--------|----------|---------------------|
| Move | A/D or ←/→ | ←/→ / A/D |
| Jump | Space or ↑ | ↑ / Space |
| Drop through platform | S or ↓ | ↓ / S |
| Melee | F | — / H |
| Shoot (if ranged) | Left Click | Left Click / — |
| Aim | Mouse | Mouse / — |
| Pause | ESC | ESC |

---

## Built by an AI Crew

This project was developed by a pipeline of **8 specialized AI agents** working in 4 sequential phases:

### The Agents

| Agent | Job |
|-------|-----|
| Product Designer | Writes the GDD, defines rules & mechanics |
| Technical Game Designer | Balances numbers (speed, damage, knockback) |
| Asset Integrator | Maps sprites, animations, and audio |
| AI Systems Designer | Designs the FSM, loyalty system, NPC behavior |
| Gameplay Programmer | Writes all Phaser 4 + TypeScript code |
| Code Reviewer | Checks code quality against GDD specs |
| QA Tester | Monitors compilation, fixes bugs |
| Tech Scribe | Logs everything for full traceability |

### The Skills

| Skill | What it covers |
|-------|----------------|
| [Spatial Calculation](skills/spatial-calculation.md) | NPC navigation, edge detection, line of sight |
| [FSM AI](skills/fsm-ai.md) | Loyal/Doubtful/Hostile state machine |
| [Arcade Physics](skills/arcade-physics.md) | Collisions, knockback, platform movement |
| [Phaser & TypeScript](skills/phaser-typescript.md) | Code structure, typing, Phaser lifecycle |
| [Defensive Programming](skills/defensive-programming.md) | Null safety, runtime protection |
| [Semantic Commits](skills/semantic-commits.md) | Standardized git history |

### The Pipeline

```
Ideation → Architecture → Development → Validation
```

Each phase feeds into the next. More details in [`workflow/workflow.md`](workflow/workflow.md).

---

## Project Structure

```
src/
├── main.ts                  # Game config + Phaser init
├── config/GameConstants.ts  # All constants, stages, animations
├── scenes/
│   ├── MenuScene.ts         # Character select menu
│   └── GameScene.ts         # Main game loop
├── entities/
│   └── DinoCharacter.ts     # Player/enemy physics sprite
├── systems/
│   ├── InputManager.ts      # Keyboard input
│   ├── BulletManager.ts     # Projectile system
│   └── PlatformManager.ts   # Platforms, LoS, collisions
├── ui/
│   ├── ScoreboardUI.ts      # Score display
│   ├── CountdownUI.ts       # 3-2-1-Go!
│   └── PauseMenuUI.ts       # Pause overlay
└── fsm/
    └── AllyFSM.ts           # Ally loyalty state machine
```

---

## Game Mechanics

- **HP:** 3 hits per life. 3rd hit = elimination.
- **Knockback:** Getting hit pushes you back + brief invulnerability.
- **Falling off screen** = instant elimination.
- **Win a round** → score a point, reshuffle roles, rotate stage.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview production build |

---

## Docs

- [Game Design Document](docs/GDD.md)
- [AI Architecture](docs/AI_ARCHITECTURE.md)
