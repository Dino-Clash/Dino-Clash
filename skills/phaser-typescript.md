# Phaser 4 & TypeScript Syntax

## Purpose
Establish development guidelines using Phaser 4 and TypeScript syntax to guarantee code modularity, proper scene lifecycle management, and strict object-oriented typing.

## Mandatory Directives
- **Framework modularity understanding**: Organize the code modularly, separating game logic from presentation.
- **Scene lifecycle management**: Correctly manage the main Phaser scene lifecycle methods (`preload`, `create`, `update`).
- **Strict object-oriented typing**: Employ strongly-typed TypeScript classes, avoiding the use of lax or generic types such as `any`.

## Anti-patterns
- Using `any` to bypass TypeScript type-checking on Phaser engine objects.
- Overloading the `update` method with logic that should be initialized in `create` or handled via events.
- Failing to use standard object-oriented programming inheritance and polymorphism when extending Phaser base classes (such as `Phaser.Scene` or `Phaser.GameObjects.Sprite`).
- Declaring scene state variables globally or outside the scope of the scene class.
