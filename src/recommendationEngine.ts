import {
  AthleteProfile,
  CompletedActivity,
  DailyRecommendation,
  PlannedWorkout,
  Shoe,
} from "./types.js";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getRelativeDateKey(base: Date, plusDays: number): string {
  const next = new Date(base);
  next.setDate(base.getDate() + plusDays);
  return toDateKey(next);
}

function estimateLoad(activity: CompletedActivity, profile: AthleteProfile): number {
  const rpeFactor = activity.rpe ? activity.rpe / 10 : 0.6;
  const hrFactor = activity.avgHeartRate
    ? activity.avgHeartRate / Math.max(profile.maxHr, 1)
    : 0.7;
  return activity.durationMinutes * (rpeFactor + hrFactor) / 2;
}

function calculateAcuteLoad(
  activities: CompletedActivity[],
  profile: AthleteProfile,
  now: Date,
): number {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return activities
    .filter((a) => new Date(a.date) >= sevenDaysAgo)
    .reduce((sum, a) => sum + estimateLoad(a, profile), 0);
}

function calculateChronicLoad(
  activities: CompletedActivity[],
  profile: AthleteProfile,
  now: Date,
): number {
  const fortyTwoDaysAgo = new Date(now);
  fortyTwoDaysAgo.setDate(now.getDate() - 42);

  const total = activities
    .filter((a) => new Date(a.date) >= fortyTwoDaysAgo)
    .reduce((sum, a) => sum + estimateLoad(a, profile), 0);

  return total / 6;
}

function chooseShoe(workout: PlannedWorkout, shoes: Shoe[]): Shoe | undefined {
  if (workout.sport !== "run") {
    return undefined;
  }
  if (workout.workoutType === "intervals" || workout.workoutType === "vo2max") {
    return shoes.find((shoe) => shoe.type === "speed" || shoe.type === "race");
  }
  if (workout.workoutType === "long") {
    return shoes.find((shoe) => shoe.type === "daily" || shoe.type === "recovery");
  }
  return shoes.find((shoe) => shoe.type === "daily") ?? shoes[0];
}

function paceSuggestion(workout: PlannedWorkout, profile: AthleteProfile, fatigue: number): string | undefined {
  if (workout.sport !== "run") {
    return undefined;
  }
  const conservativeFactor = fatigue > 1.3 ? 1.04 : 1;

  switch (workout.workoutType) {
    case "recovery":
      return `${round(profile.easyPaceMinKmMax * conservativeFactor)} - ${round(
        (profile.easyPaceMinKmMax + 0.4) * conservativeFactor,
      )} min/km`;
    case "easy":
    case "long":
      return `${round(profile.easyPaceMinKmMin * conservativeFactor)} - ${round(
        profile.easyPaceMinKmMax * conservativeFactor,
      )} min/km`;
    case "tempo":
    case "threshold":
      return `${round((profile.thresholdPaceMinKm - 0.1) * conservativeFactor)} - ${round(
        profile.thresholdPaceMinKm * conservativeFactor,
      )} min/km`;
    case "vo2max":
    case "intervals":
      return `${round((profile.thresholdPaceMinKm - 0.35) * conservativeFactor)} - ${round(
        (profile.thresholdPaceMinKm - 0.2) * conservativeFactor,
      )} min/km`;
    case "technique":
    default:
      return undefined;
  }
}

function powerSuggestion(workout: PlannedWorkout, profile: AthleteProfile): string | undefined {
  if (workout.sport !== "bike" && workout.sport !== "brick") {
    return undefined;
  }
  switch (workout.workoutType) {
    case "easy":
    case "long":
    case "recovery":
      return `${round(profile.ftpBike * 0.6)} - ${round(profile.ftpBike * 0.75)} W`;
    case "threshold":
    case "tempo":
      return `${round(profile.ftpBike * 0.9)} - ${round(profile.ftpBike * 1.0)} W`;
    case "vo2max":
    case "intervals":
      return `${round(profile.ftpBike * 1.05)} - ${round(profile.ftpBike * 1.2)} W`;
    case "technique":
    default:
      return undefined;
  }
}

function hrZoneSuggestion(workout: PlannedWorkout, profile: AthleteProfile): string {
  if (workout.sport === "bike" || workout.sport === "brick") {
    return `Z2 ${round(profile.lthrBike * 0.81)}-${round(profile.lthrBike * 0.89)} bpm`;
  }
  return `Z2 ${round(profile.lthrRun * 0.81)}-${round(profile.lthrRun * 0.89)} bpm`;
}

export function generateTomorrowRecommendation(params: {
  profile: AthleteProfile;
  plannedWorkouts: PlannedWorkout[];
  completedActivities: CompletedActivity[];
  shoes: Shoe[];
  now?: Date;
}): DailyRecommendation {
  const now = params.now ?? new Date();
  const tomorrowKey = getRelativeDateKey(now, 1);

  const tomorrowWorkout =
    params.plannedWorkouts
      .filter((item) => item.date === tomorrowKey)
      .sort((a, b) => b.priority - a.priority)[0] ?? null;

  if (!tomorrowWorkout) {
    return {
      date: tomorrowKey,
      summary: "No hay entrenamiento planificado para mañana.",
      target: "Recuperación activa o descanso",
      rationale: "No se encontró sesión en el calendario manual.",
    };
  }

  const acute = calculateAcuteLoad(params.completedActivities, params.profile, now);
  const chronic = Math.max(
    calculateChronicLoad(params.completedActivities, params.profile, now),
    1,
  );
  const fatigueRatio = acute / chronic;
  const shoe = chooseShoe(tomorrowWorkout, params.shoes);
  const warning =
    fatigueRatio > 1.3
      ? "Carga aguda alta: conviene bajar intensidad 3-5%."
      : undefined;

  return {
    date: tomorrowKey,
    summary: `${tomorrowWorkout.title} (${tomorrowWorkout.sport})`,
    target: tomorrowWorkout.workoutType,
    suggestedPace: paceSuggestion(tomorrowWorkout, params.profile, fatigueRatio),
    suggestedPower: powerSuggestion(tomorrowWorkout, params.profile),
    suggestedHrZone: hrZoneSuggestion(tomorrowWorkout, params.profile),
    suggestedShoe: shoe?.name,
    warning,
    rationale: `Reglas: tipo de sesión + zonas personales + ratio de fatiga ${round(
      fatigueRatio,
    )}.`,
  };
}
