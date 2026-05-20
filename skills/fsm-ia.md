# Máquinas de Estados Finitos (FSM)

## Propósito
Definir la arquitectura lógica basada en Máquinas de Estados Finitos (FSM) para controlar de forma predecible el ciclo de las rondas de juego y gestionar los cambios en el comportamiento y nivel de lealtad de la IA aliada.

## Directivas Obligatorias
- **Arquitectura lógica para gestionar el flujo de las rondas de juego**: Implementar una máquina de estados para controlar la secuencia y transiciones de las rondas.
- **Transicionar los estados de comportamiento del aliado**: Gestionar los cambios de actitud de los PNJs aliados entre los estados de **Leal**, **Dudoso** y **Hostil**.

## Anti-patrones
- Usar variables booleanas independientes y dispersas (ej. `isLoyal`, `isHostile`, `isRoundFinished`) en lugar de estados discretos de una FSM estructurada.
- Transicionar entre estados sin ejecutar funciones controladas de entrada (`enter`) y salida (`exit`), lo que genera estados inconsistentes o animaciones rotas.
- Permitir transiciones directas de estado prohibidas por la lógica del diseño (ej. transicionar de Leal a Hostil de manera instantánea sin pasar por el estado Dudoso o sin un evento desencadenante claro).
- Ejecutar la lógica de toma de decisiones completa en cada frame en lugar de reaccionar a eventos o señales de cambio de estado.
