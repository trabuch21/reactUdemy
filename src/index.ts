import "dotenv/config";

import cors from "cors";
import express from "express";
import cron from "node-cron";
import { z } from "zod";

import { generateTomorrowRecommendation } from "./recommendationEngine.js";
import {
  addCompletedActivity,
  addPlannedWorkout,
  addShoe,
  readStore,
  saveRecommendation,
} from "./storage.js";
import { ActivitySource, PlanSource, ShoeType, Sport, WorkoutType } from "./types.js";

const app = express();
app.use(cors());
app.use(express.json());

const sportSchema = z.enum(["run", "bike", "swim", "strength", "brick"] satisfies [Sport, ...Sport[]]);
const workoutTypeSchema = z.enum(
  ["easy", "long", "tempo", "intervals", "vo2max", "threshold", "recovery", "technique"] satisfies [
    WorkoutType,
    ...WorkoutType[],
  ],
);
const planSourceSchema = z.enum(["trainingpeaks", "running_team_app", "manual"] satisfies [PlanSource, ...PlanSource[]]);
const activitySourceSchema = z.enum(["strava", "garmin", "manual"] satisfies [ActivitySource, ...ActivitySource[]]);
const shoeTypeSchema = z.enum(["daily", "speed", "race", "trail", "recovery"] satisfies [ShoeType, ...ShoeType[]]);

const addPlannedWorkoutSchema = z.object({
  source: planSourceSchema.default("manual"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sport: sportSchema,
  workoutType: workoutTypeSchema,
  title: z.string().min(3),
  description: z.string().optional(),
  plannedDurationMinutes: z.number().positive().optional(),
  plannedDistanceKm: z.number().positive().optional(),
  priority: z.number().int().min(1).max(5).default(3),
});

const addCompletedActivitySchema = z.object({
  source: activitySourceSchema.default("manual"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sport: sportSchema,
  distanceKm: z.number().positive().optional(),
  durationMinutes: z.number().positive(),
  avgPaceMinKm: z.number().positive().optional(),
  avgHeartRate: z.number().int().positive().optional(),
  maxHeartRate: z.number().int().positive().optional(),
  avgPower: z.number().positive().optional(),
  rpe: z.number().min(1).max(10).optional(),
  shoeId: z.string().uuid().optional(),
});

const addShoeSchema = z.object({
  name: z.string().min(2),
  type: shoeTypeSchema,
  maxKm: z.number().positive(),
  currentKm: z.number().min(0).default(0),
});

async function computeAndStoreTomorrowRecommendation(): Promise<void> {
  const store = await readStore();
  const recommendation = generateTomorrowRecommendation({
    profile: store.profile,
    plannedWorkouts: store.plannedWorkouts,
    completedActivities: store.completedActivities,
    shoes: store.shoes,
  });
  await saveRecommendation(recommendation);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/store", async (_req, res) => {
  const store = await readStore();
  res.json(store);
});

app.post("/api/planned-workouts", async (req, res) => {
  const parsed = addPlannedWorkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const created = await addPlannedWorkout(parsed.data);
  return res.status(201).json(created);
});

app.post("/api/completed-activities", async (req, res) => {
  const parsed = addCompletedActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const created = await addCompletedActivity(parsed.data);
  return res.status(201).json(created);
});

app.post("/api/shoes", async (req, res) => {
  const parsed = addShoeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const created = await addShoe(parsed.data);
  return res.status(201).json(created);
});

app.post("/api/recommendations/run-nightly", async (_req, res) => {
  await computeAndStoreTomorrowRecommendation();
  const store = await readStore();
  const recommendation = store.recommendations.sort((a, b) => b.date.localeCompare(a.date))[0];
  return res.status(201).json(recommendation);
});

app.get("/api/recommendations/tomorrow", async (_req, res) => {
  const store = await readStore();
  const recommendation = generateTomorrowRecommendation({
    profile: store.profile,
    plannedWorkouts: store.plannedWorkouts,
    completedActivities: store.completedActivities,
    shoes: store.shoes,
  });
  return res.json(recommendation);
});

cron.schedule("0 23 * * *", async () => {
  await computeAndStoreTomorrowRecommendation();
  // eslint-disable-next-line no-console
  console.log("Nightly recommendation generated.");
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Training recommendation API running on http://localhost:${port}`);
});
