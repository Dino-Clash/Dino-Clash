# Auto-Documentación y Auditoría de Sesión

## Propósito
Garantizar la trazabilidad y auditoría de la sesión de desarrollo mediante la interceptación y el registro automatizado de cada interacción en el entorno.

## Directivas Obligatorias
- **Interceptación y registro automático**: Capturar cada interacción del agente en el entorno sin intervención manual.
- **Guardado en bitácora**: Guardar en el archivo `docs/PROMPTS_LOG.md` el prompt exacto utilizado.
- **Detalle de metadatos**: Registrar obligatoriamente el modelo LLM utilizado, el agente asignado y el consumo total de tokens.
- **Garantizar la trazabilidad**: Cumplir rigurosamente con los requisitos de trazabilidad definidos para el proyecto.

## Anti-patrones
- Registrar de forma manual o selectiva solo algunas interacciones, omitiendo los cambios incrementales o de menor envergadura.
- Omitir campos obligatorios como el consumo de tokens o la versión exacta del modelo LLM.
- No crear o ignorar la existencia del archivo de registro centralizado `docs/PROMPTS_LOG.md`, guardando la información en archivos temporales o dispersos.
- Registrar información formateada incorrectamente que no sea fácilmente legible o procesable mediante herramientas automatizadas.
