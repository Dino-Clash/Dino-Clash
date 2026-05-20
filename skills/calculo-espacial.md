# Cálculo Espacial e Inteligencia de Entorno

## Propósito
Establecer las metodologías matemáticas y de IA espacial para permitir que los personajes no jugadores (PNJ) analicen su entorno, tracen líneas de visión y tomen decisiones de navegación seguras y predictivas.

## Directivas Obligatorias
- **Trazar líneas de visión (Raycasting)**: Desarrollar la capacidad matemática para trazar un rayo desde el arma del PNJ hasta su objetivo, detectando colisiones u obstáculos en el camino.
- **Detección predictiva de plataformas**: Evaluar con anticipación la presencia de plataformas en la dirección del movimiento del PNJ.
- **Análisis de bordes de caída**: Analizar y detectar los bordes de las plataformas para evitar que la IA realice acciones o movimientos autodestructivos (comportamientos suicidas).

## Anti-patrones
- Ejecutar trazado de líneas de visión (Raycasting) en cada actualización física o frame sin limitar su frecuencia o rango máximo de alcance, degradando el rendimiento general.
- Asumir que el PNJ siempre se encuentra en suelo firme sin realizar chequeos de proyección vertical previos al movimiento.
- Ignorar los bordes de caída del mapa, haciendo que los PNJs caminen directamente al vacío en lugar de detenerse, cambiar de dirección o saltar de forma inteligente.
- No tener en cuenta la posición y orientación de la pistola del PNJ (offset) al trazar el rayo de visión, haciendo que los disparos o la detección de línea de visión parezcan surgir desde el centro geométrico del personaje.
