export type Sport = "run" | "bike" | "swim" | "strength" | "brick";

export type WorkoutType =
  | "easy"
  | "long"
  | "tempo"
  | "intervals"
  | "vo2max"
  | "threshold"
  | "recovery"
  | "technique";

export type PlanSource = "trainingpeaks" | "running_team_app" | "manual";
export type ActivitySource = "strava" | "garmin" | "manual";
export type ShoeType = "daily" | "speed" | "race" | "trail" | "recovery";

export interface PlannedWorkout {
  id: string;
  source: PlanSource;
  date: string; // YYYY-MM-DD
  sport: Sport;
  workoutType: WorkoutType;
  title: string;
  description?: string;
  plannedDurationMinutes?: number;
  plannedDistanceKm?: number;
  priority: number; // 1-5
}

export interface CompletedActivity {
  id: string;
  source: ActivitySource;
  date: string; // YYYY-MM-DD
  sport: Sport;
  distanceKm?: number;
  durationMinutes: number;
  avgPaceMinKm?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPower?: number;
  rpe?: number; // 1-10
  shoeId?: string;
}

export interface Shoe {
  id: string;
  name: string;
  type: ShoeType;
  maxKm: number;
  currentKm: number;
}

export interface AthleteProfile {
  maxHr: number;
  restingHr: number;
  lthrRun: number;
  lthrBike: number;
  ftpBike: number;
  thresholdPaceMinKm: number;
  easyPaceMinKmMin: number;
  easyPaceMinKmMax: number;
}

export interface DailyRecommendation {
  date: string;
  summary: string;
  target: string;
  suggestedPace?: string;
  suggestedPower?: string;
  suggestedHrZone?: string;
  suggestedShoe?: string;
  warning?: string;
  rationale: string;
}

export interface DataStore {
  profile: AthleteProfile;
  plannedWorkouts: PlannedWorkout[];
  completedActivities: CompletedActivity[];
  shoes: Shoe[];
  recommendations: DailyRecommendation[];
}
