# Game Design Document (v1.0)
**Project Name:** NebriGame / Dino-Clash
**Genre:** 2v2 Platform Fighter

---

## 1. Game Overview
NebriGame is a fast-paced, 2v2 team-based platform fighting game featuring dinosaur characters. Players engage in arena combat, utilizing a mix of melee and ranged weaponry. The game features a dynamic companion loyalty system, where friendly fire can turn an AI ally into a hostile enemy. Rounds are structured with rotating stages, sudden death mechanics, and strict hit-based combat.

### 1.1 Match Flow
- **Start Menu:** A grid displaying available dinosaur characters with color-coded backgrounds. Characters play an "Idle" animation. Selecting a character changes their animation to "Move" and enables the "Start" button.
- **Round Start:** Characters spawn in random locations on platform stages. A countdown sequence (3... 2... 1... Go!) initiates the round. AI and movement are disabled during the countdown.
- **Round End:** When a team is completely eliminated, the round ends. The surviving team is awarded a point. Characters respawn with full health, roles (Ranged/Melee) are randomized, the stage rotates to a new layout, and a new countdown begins.

### 1.2 User Interface (UI)
- **Scoreboard:** Fixed at the top of the screen displaying the current score in an "X - Y" format.
  - **Left Number:** Represents the Player's team score (colored to match the Player's chosen dinosaur).
  - **Right Number:** Represents the Enemy team's score (colored to match one of the enemy NPCs).
- **Indicators:** The Player's AI Ally displays a floating status icon above their head (Green Arrow, Yellow Question Mark, or Red Exclamation Mark) to indicate their current Loyalty State.

---

## 2. Core Mechanics

### 2.1 Movement & Controls
- **Horizontal Movement:** Controlled via `A` (Left) and `D` (Right) keys. The character moves continuously in the specified direction while the key is held.
- **Jumping:** Controlled via the `Space` bar. Jumping allows characters to traverse platforms and cross gaps. 
  - Characters maintain mid-air horizontal mobility.
  - Jumping is strictly restricted to grounded states (the bottom of the character's hitbox must be in contact with a platform's top edge).
- **Abyss Elimination:** Falling off the bottom of the screen results in immediate elimination for the remainder of the round.

### 2.2 Health & Damage System (Knockback)
- **Hit Points (HP):** Every character has a maximum of 3 HP (can survive 3 hits). 
- **Damage Instances:** The 3rd hit sustained triggers an immediate elimination from the current round. HP resets to 3 at the start of a new round.
- **Hit Reactions (Hurt State):** Receiving damage triggers the "Hurt" animation.
  - **Invulnerability:** The character gains exactly 1 second of invulnerability frames (i-frames).
  - **Knockback:** The character is physically pushed along the X-axis in the direction opposite to the impact point (e.g., a hit on the left side of the hitbox pushes the character to the right).

---

## 3. Characters & AI Behavior

Every round consists of 4 characters: The Player, 1 Allied NPC, and 2 Enemy NPCs. 

### 3.1 NPC Navigation & Movement Rules
- **Platform Awareness:** NPCs will never voluntarily jump or walk into the bottomless abyss. They prioritize landing on safe platforms.
- **Ceiling Checks:** NPCs will only execute a jump if the overhead trajectory is clear of blocking platforms for the entire jump arc.

### 3.2 AI Combat Profiles
- **Ranged AI:** 
  - Aims and fires at the nearest enemy target. 
  - Will only move or jump to establish a clear Line of Sight (LoS) free of intervening platforms or allied hitboxes.
- **Melee AI:**
  - Employs aggressive pathfinding (moving and jumping) to close the distance to the nearest enemy target.
  - Executes melee attacks only when within immediate striking range.

---

## 4. Weapons & Combat

Each team is randomly assigned one Ranged character and one Melee character at the start of every round. 

### 4.1 Ranged Combat (Gun)
- **Mechanics:** The gun object rotates around the character along a fixed radius. For the Player, the gun follows the mouse cursor. For NPCs, the gun automatically aims at the nearest target.
- **NPC Aiming Delay:** The NPC's gun rotation speed is clamped to allow the Player a fair window to evade or flank the aiming vector.
- **Firing Rate:** 1 shot every 2 seconds. (Triggered by Left-Click for the Player).
- **Projectile Properties:**
  - Visualized as a fast-moving yellow line with no trailing particles.
  - Travels strictly in a straight line based on the cursor/aim angle at the moment of firing. Does not track or home.
  - Destroyed instantly upon collision with a character hitbox (friendly or enemy), a platform edge, or the screen bounds.

### 4.2 Melee Combat (Unarmed)
- **Firing Rate:** 1 attack every 1 second. (Triggered by Left-Click for the Player).
- **Mechanics:** Activates the "Attack" animation. 
- **Hit Detection:** If the character's hitbox intersects with any allied or enemy hitbox *during* the attack animation, the hit registers, applying damage and Knockback.

---

## 5. Betrayal FSM Logic

The Player's AI Ally operates on a Finite State Machine dictated by a Loyalty Meter. The ally responds dynamically to friendly fire.

### 5.1 Loyalty Meter 
- **Base Value:** Starts at `100`.
- **Friendly Fire Penalty:** Every player attack (melee or ranged) that strikes the Ally applies a `-10` penalty.
- **Betrayal Death Penalty:** If the Ally is eliminated from the round and the final killing blow was dealt by the Player, a `-25` penalty is applied.
- **Passive Recovery:** Winning a round while the Ally is in the Inactive/Hostile states recovers `+15` Loyalty points.

### 5.2 FSM States
* **State 1: Loyal (Meter > 20)**
  * **Indicator:** Green Arrow above head.
  * **Behavior:** Fights alongside the Player. Targets Enemy NPCs.
* **State 2: Inactive (Meter between -20 and 20)**
  * **Indicator:** Yellow Question Mark (`?`) above head.
  * **Behavior:** The Ally enters a state of shock/doubt. They remain completely static and refuse to participate in combat.
* **State 3: Hostile (Meter < -20)**
  * **Indicator:** Red Exclamation Mark (`!`) above head.
  * **Behavior:** Triggered if the Player continues to attack the Ally while they are Inactive. The Ally actively hunts and attacks the Player, entirely ignoring Enemy NPCs until Loyalty recovers back to the `[-20, 20]` threshold through passive recovery.
