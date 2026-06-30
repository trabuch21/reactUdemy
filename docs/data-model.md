# Modelo de datos (MVP Fase 1: carga manual)

## Objetivo

Modelar entrenamientos planificados, actividades realizadas, perfil del atleta y recomendaciones diarias.

## Entidades

### AthleteProfile

- `maxHr`
- `restingHr`
- `lthrRun`
- `lthrBike`
- `ftpBike`
- `thresholdPaceMinKm`
- `easyPaceMinKmMin`
- `easyPaceMinKmMax`

### PlannedWorkout

- `id`
- `source` (`trainingpeaks | running_team_app | manual`)
- `date` (YYYY-MM-DD)
- `sport` (`run | bike | swim | strength | brick`)
- `workoutType` (`easy | long | tempo | intervals | vo2max | threshold | recovery | technique`)
- `title`
- `description`
- `plannedDurationMinutes`
- `plannedDistanceKm`
- `priority` (1-5)

### CompletedActivity

- `id`
- `source` (`strava | garmin | manual`)
- `date`
- `sport`
- `distanceKm`
- `durationMinutes`
- `avgPaceMinKm`
- `avgHeartRate`
- `maxHeartRate`
- `avgPower`
- `rpe` (1-10)
- `shoeId`

### Shoe

- `id`
- `name`
- `type` (`daily | speed | race | trail | recovery`)
- `maxKm`
- `currentKm`

### DailyRecommendation

- `date`
- `summary`
- `target`
- `suggestedPace`
- `suggestedPower`
- `suggestedHrZone`
- `suggestedShoe`
- `warning`
- `rationale`

## Reglas del motor (sin IA)

1. Fatiga: ratio `acute_load / chronic_load` usando estimación de carga por duración e intensidad.
2. Ritmos running por tipo de sesión: easy, long, tempo, threshold, vo2max, intervals.
3. Potencia bike por `%FTP` según tipo de sesión.
4. Zona HR sugerida por `%LTHR`.
5. Selección de zapatilla por tipo de sesión y desgaste acumulado.

## Persistencia inicial

- Archivo local `data/store.json`.
- En fase 2 migrar a PostgreSQL con el mismo modelo conceptual.
