# Defensive Programming

## Purpose
Establish guidelines to prevent catastrophic failures and unhandled runtime exceptions by validating the state and existence of entities in memory before any interaction.

## Mandatory Directives
- **Anticipate runtime errors**: Design logical flows assuming that external components and physical references might be unavailable.
- **Constant verification on every frame**: Enforce rigorous checks of entity existence and validity in memory before processing any physical or logical calculations in update loops.

## Anti-patterns
- Accessing physical properties (`entity.body.velocity`) or game states directly without first verifying that `entity` and `entity.body` are defined and initialized.
- Assuming that references returned by Phaser's physical collision events always point to live, active entities in the current scene.
- Omitting `try/catch` blocks or optional chaining operators (`?.`) when consuming or updating resources whose asynchronous availability is not guaranteed.
- Allowing pointers to destroyed entities (`ghost references`) to persist without clearing local variables or class properties referencing them.
