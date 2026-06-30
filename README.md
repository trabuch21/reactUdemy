# Training Recommendation MVP (manual-first)

Backend inicial para:

- cargar entrenamientos planificados manualmente
- cargar entrenamientos realizados manualmente
- registrar zapatillas
- calcular recomendación del entrenamiento de mañana con reglas (sin IA)

## Requisitos

- Node.js 20+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

API en `http://localhost:3001`.

## Endpoints

### Salud

- `GET /health`

### Ver estado actual

- `GET /api/store`

### Cargar entrenamiento planificado

- `POST /api/planned-workouts`

Ejemplo:

```json
{
  "source": "manual",
  "date": "2026-07-01",
  "sport": "run",
  "workoutType": "intervals",
  "title": "6x800",
  "plannedDurationMinutes": 60,
  "priority": 4
}
```

### Cargar entrenamiento realizado

- `POST /api/completed-activities`

Ejemplo:

```json
{
  "source": "manual",
  "date": "2026-06-30",
  "sport": "run",
  "durationMinutes": 55,
  "distanceKm": 10.2,
  "avgHeartRate": 154,
  "rpe": 6
}
```

### Registrar zapatilla

- `POST /api/shoes`

Ejemplo:

```json
{
  "name": "Adidas Boston 12",
  "type": "daily",
  "maxKm": 700,
  "currentKm": 320
}
```

### Ver recomendación de mañana (on-demand)

- `GET /api/recommendations/tomorrow`

### Ejecutar corrida nocturna manualmente

- `POST /api/recommendations/run-nightly`

Además, hay cron interno diario:

- `23:00` -> genera recomendación del día siguiente.

## Siguiente fase

1. Reemplazar `data/store.json` por PostgreSQL.
2. Integrar importadores automáticos:
   - TrainingPeaks (planificados triatlón)
   - Running team app (planificados running)
   - Strava/Garmin (realizados)
