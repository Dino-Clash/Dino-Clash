# Sintaxis Phaser 4 & TypeScript

## Propósito
Establecer las directrices de desarrollo utilizando la sintaxis de Phaser 4 y TypeScript para garantizar la modularidad del código, la correcta gestión del ciclo de vida de las escenas y el cumplimiento del tipado estricto orientado a objetos.

## Directivas Obligatorias
- **Comprensión de la modularidad del framework**: Organizar el código de forma modular, separando la lógica del juego de la presentación.
- **Ciclo de vida de las escenas**: Gestionar adecuadamente los métodos principales del ciclo de vida de Phaser (`preload`, `create`, `update`).
- **Tipado estricto orientado a objetos**: Emplear clases de TypeScript con tipado fuerte, evitando el uso de tipos genéricos o laxos como `any`.

## Anti-patrones
- Evitar el uso de `any` para omitir la comprobación de tipos de TypeScript en objetos del motor de Phaser.
- Sobrecargar la función `update` con lógica que debería ser inicializada en `create` o gestionada mediante eventos.
- No utilizar la herencia y polimorfismo propios de la programación orientada a objetos para extender las clases base de Phaser (como `Phaser.Scene` o `Phaser.GameObjects.Sprite`).
- Declarar variables de estado de la escena como variables globales o fuera del alcance de la clase de la escena.
