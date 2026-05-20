# Programación Defensiva (Defensive Programming)

## Propósito
Establecer las pautas para prevenir fallos catastróficos y excepciones no controladas en tiempo de ejecución, garantizando que el estado y la existencia de las entidades en memoria sean validados antes de cualquier interacción.

## Directivas Obligatorias
- **Anticipar errores en tiempo de ejecución**: Diseñar el flujo lógico asumiendo que los componentes externos y las referencias físicas pueden no estar disponibles.
- **Verificación constante en cada frame**: Forzar la verificación rigurosa de la existencia y validez en memoria de las entidades de juego antes de procesar cualquier cálculo físico o lógico en los bucles de actualización.

## Anti-patrones
- Acceder directamente a propiedades físicas (`entity.body.velocity`) o estados de juego sin antes verificar si `entity` o `entity.body` están definidos e inicializados.
- Asumir que las referencias devueltas por los eventos de colisión física de Phaser siempre apuntan a entidades vivas o activas en la escena actual.
- Omitir el uso de bloques `try/catch` u operadores de encadenamiento opcional (`?.`) al consumir o actualizar recursos cuya disponibilidad asíncrona no esté garantizada.
- Permitir la persistencia de punteros a entidades ya destruidas (`ghost references`) sin limpiar las variables locales o propiedades de clase que las apuntan.
