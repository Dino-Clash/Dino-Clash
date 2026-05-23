# AI Architecture and Blueprints

## 1. Finite State Machine (FSM): Betrayal Mechanics

The AI Ally operates on a strict Finite State Machine driven by a numerical Loyalty Meter.

### 1.1 Loyalty Meter Mathematics
- **Initial State:** `100` points.
- **Modifiers:**
  - Friendly Fire (Player hits Ally): `-10` points per hit.
  - Betrayal Elimination (Player deals the final blow to Ally): `-25` points.
  - Passive Recovery (Round won while Ally is Inactive/Hostile): `+15` points.

### 1.2 State Transition Triggers
The FSM contains three primary states based on the loyalty threshold:

*   **State: Loyal**
    *   **Condition:** Loyalty Meter `> 20`.
    *   **Behavior:** Actively targets and attacks Enemy NPCs. Follows standard combat AI routines.
    *   **Trigger (Exit to Inactive):** Loyalty Meter drops to `<= 20`.

*   **State: Inactive (Doubtful)**
    *   **Condition:** Loyalty Meter is between `-20` and `20` (inclusive).
    *   **Behavior:** Suspends all movement and combat logic. Remains completely static.
    *   **Trigger (Exit to Loyal):** Loyalty Meter rises to `> 20` (via passive recovery).
    *   **Trigger (Exit to Hostile):** Loyalty Meter drops to `< -20` (via further friendly fire).

*   **State: Hostile**
    *   **Condition:** Loyalty Meter `< -20`.
    *   **Behavior:** Completely ignores Enemy NPCs. Actively hunts, targets, and attacks the Player.
    *   **Trigger (Exit to Inactive):** Loyalty Meter rises to `>= -20` (via passive recovery across multiple rounds).

---

## 2. Spatial Raycasting: Line of Sight (LoS)

Armed NPCs (Ranged combatants) must evaluate valid attack vectors before firing to avoid wasting shots on geometric platforms.

### 2.1 Raycasting Logic
- **Origin Point:** The ray originates from the exact offset of the NPC's equipped weapon (Texture Key: `weapon_gun`), not the character's geometric center.
- **Target Vector:** The ray casts directly towards the center of the nearest valid target's hitbox.
- **Collision Evaluation:**
  - If the ray intersects a **Geometric Primitive Platform** (solid rectangle from Arcade Physics) before reaching the target, the LoS is considered **BLOCKED**. The NPC will attempt to reposition.
  - If the ray reaches the target's hitbox without hitting a platform, the LoS is considered **CLEAR**. The NPC will fire.

---

## 3. Predictive Navigation

To prevent NPCs from exhibiting suicidal behavior (walking into the abyss or jumping into traps), they must constantly scan their immediate surroundings using spatial projections.

### 3.1 Edge Detection (Void Avoidance)
- **Downward Projection:** Before moving horizontally, the NPC projects a short, vertical downward ray just ahead of their current movement trajectory (offset by half their hitbox width in the direction of movement).
- **Evaluation:** If the downward ray fails to collide with a Geometric Primitive Platform (meaning there is no ground ahead), a **Ledge Drop** is detected.
- **Action:** The NPC will immediately halt horizontal movement, change direction, or calculate a safe jump trajectory, preventing them from falling off the screen.

### 3.2 Ceiling Checks
- **Upward Arc Projection:** Before executing a jump, the NPC evaluates the jump arc trajectory.
- **Evaluation:** If platforms block the overhead space required for the jump arc, the jump is aborted to prevent the NPC from bonking their head and falling into a disadvantageous position.
