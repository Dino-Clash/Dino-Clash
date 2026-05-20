# Advanced Arcade Physics

## Purpose
Define guidelines for the advanced usage of Phaser's Arcade Physics engine, focusing on precise AABB collision management, instant velocity manipulation, and clean physical entity destruction.

## Mandatory Directives
- **AABB collision management**: Configure and control AABB (Axis-Aligned Bounding Box) collisions between different game entities.
- **Instant velocity vector manipulation**: Use rapid changes in velocity vectors to apply bounce or pushback (knockback) effects following an impact.
- **Efficient entity destruction**: Optimally clean up physical entities that are no longer needed to free memory resources.

## Anti-patterns
- Moving physical entities by directly manipulating their `x` and `y` coordinates during a knockback instead of using velocity vectors (`setVelocity`).
- Retaining hidden or inactive physical entities in memory without invoking their physics destruction methods (`destroy()` or `disableBody`).
- Failing to configure collision boundaries (bounding boxes), resulting in ghost or visually misaligned collisions.
- Running heavy, repetitive collision logic in custom loops inside the `update` method instead of utilizing the physics engine's native colliders and overlaps.
