# Arcade Physics Avanzado

## Propósito
Definir las directrices para el uso avanzado del motor físico Arcade Physics de Phaser, enfocándose en la gestión precisa de colisiones AABB, la manipulación de la velocidad instantánea y la destrucción limpia de las entidades físicas.

## Directivas Obligatorias
- **Gestión de colisiones AABB**: Configurar y controlar colisiones de tipo AABB (Axis-Aligned Bounding Box) entre las diferentes entidades del juego.
- **Manipulación de vectores de velocidad instantánea**: Utilizar cambios rápidos en los vectores de velocidad para la aplicación de efectos de rebote o empuje (knockback) después de un impacto.
- **Destrucción eficiente de entidades**: Limpiar de manera óptima las entidades físicas que ya no se necesiten para liberar recursos de memoria.

## Anti-patrones
- Mover entidades físicas manipulando directamente sus coordenadas `x` e `y` durante un knockback en lugar de usar vectores de velocidad instantánea (`setVelocity`).
- Mantener en memoria entidades físicas ocultas o inactivas sin llamar a sus métodos de destrucción física (`destroy()` o `disableBody`).
- No configurar los límites de los cuerpos de colisión (bounding boxes), resultando en colisiones fantasma o desalineadas visualmente.
- Ejecutar lógica de colisiones repetitiva y pesada dentro de bucles personalizados en el método `update` en lugar de usar los colliders y overlaps nativos del motor físico.
