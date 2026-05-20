# Finite State Machines (FSM)

## Purpose
Define a logical architecture based on Finite State Machines (FSM) to control the game round flow predictably and manage behavior and loyalty state transitions for allied NPCs.

## Mandatory Directives
- **Logical architecture for game round flow management**: Implement a state machine to control the sequence and transitions of game rounds.
- **Transitioning allied behavior states**: Manage shifts in allied NPC attitude between **Loyal**, **Doubtful**, and **Hostile** states.

## Anti-patterns
- Using independent and scattered boolean variables (e.g., `isLoyal`, `isHostile`, `isRoundFinished`) instead of discrete states in a structured FSM.
- Transitioning between states without executing controlled enter (`enter`) and exit (`exit`) functions, leading to inconsistent states or broken animations.
- Allowing direct state transitions prohibited by design logic (e.g., transitioning instantly from Loyal to Hostile without passing through the Doubtful state or without a clear trigger event).
- Executing the entire decision-making logic on every frame instead of responding to events or state change signals.
