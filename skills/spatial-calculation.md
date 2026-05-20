# Spatial Calculation and Environment Intelligence

## Purpose
Establish mathematical methodologies and spatial AI algorithms to enable Non-Player Characters (NPCs) to analyze their environment, trace lines of sight, and make safe, predictive navigation decisions.

## Mandatory Directives
- **Line of sight tracing (Raycasting)**: Develop the mathematical capability to cast a ray from the NPC's gun to its target, detecting collisions or obstacles along the path.
- **Predictive platform detection**: Evaluate in advance the presence of platforms in the NPC's movement direction.
- **Ledge drop analysis**: Analyze and detect platform edges to prevent the AI from performing self-destructive actions or movements (suicidal behavior).

## Anti-patterns
- Running line of sight checks (Raycasting) on every physics update or frame without limiting frequency or maximum range, degrading overall performance.
- Assuming the NPC is always on stable ground without performing downward raycast checks before movement.
- Ignoring drop-off edges of the map, causing NPCs to walk directly into the abyss instead of stopping, changing direction, or jumping intelligently.
- Failing to account for the position and orientation of the NPC's gun (offset) when casting the line of sight ray, making shots or sight detection appear to originate from the character's geometric center.
