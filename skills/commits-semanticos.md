# Commits Semánticos (Semantic Commits)

## Propósito
Estandarizar el control de versiones en el repositorio mediante el uso consistente de prefijos semánticos definidos para cada cambio y commit realizado de manera autónoma por la IA.

## Directivas Obligatorias
- **Estandarizar el control de versiones**: Asegurar la legibilidad y la estructura histórica limpia en Git.
- **Uso obligatorio de prefijos reconocibles**: Utilizar prefijos como `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, entre otros, cada vez que la IA realice un commit autónomo en el repositorio.

## Anti-patrones
- Crear commits con mensajes genéricos, ambiguos o sin prefijo (ej. "commit", "cambios", "actualizando archivos").
- Utilizar prefijos inventados o no estandarizados (ej. `bug:`, `revertir:`, `nuevo:`).
- Realizar commits gigantescos que agrupen cambios de distinta naturaleza (por ejemplo, corregir un bug y añadir una funcionalidad en el mismo commit) bajo un único prefijo mixto.
- Omitir el uso del modo imperativo o presente en la descripción del mensaje del commit (ej. usar "fix: corrected physics" en vez de "fix: correct physics").
