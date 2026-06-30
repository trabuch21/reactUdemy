import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AthleteProfile,
  CompletedActivity,
  DailyRecommendation,
  DataStore,
  PlannedWorkout,
  Shoe,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "../data/store.json");

const defaultProfile: AthleteProfile = {
  maxHr: 190,
  restingHr: 52,
  lthrRun: 172,
  lthrBike: 168,
  ftpBike: 250,
  thresholdPaceMinKm: 4.2,
  easyPaceMinKmMin: 5.1,
  easyPaceMinKmMax: 5.8,
};

const defaultStore: DataStore = {
  profile: defaultProfile,
  plannedWorkouts: [],
  completedActivities: [],
  shoes: [],
  recommendations: [],
};

async function ensureDataFile(): Promise<void> {
  const dirPath = path.dirname(DATA_FILE);
  await mkdir(dirPath, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<DataStore> {
  await ensureDataFile();
  const raw = await readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as DataStore;
}

export async function writeStore(store: DataStore): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function addPlannedWorkout(
  workout: Omit<PlannedWorkout, "id">,
): Promise<PlannedWorkout> {
  const store = await readStore();
  const created: PlannedWorkout = { id: randomUUID(), ...workout };
  store.plannedWorkouts.push(created);
  await writeStore(store);
  return created;
}

export async function addCompletedActivity(
  activity: Omit<CompletedActivity, "id">,
): Promise<CompletedActivity> {
  const store = await readStore();
  const created: CompletedActivity = { id: randomUUID(), ...activity };
  store.completedActivities.push(created);

  if (activity.shoeId && activity.distanceKm && activity.distanceKm > 0) {
    const shoe = store.shoes.find((item) => item.id === activity.shoeId);
    if (shoe) {
      shoe.currentKm += activity.distanceKm;
    }
  }

  await writeStore(store);
  return created;
}

export async function addShoe(shoe: Omit<Shoe, "id">): Promise<Shoe> {
  const store = await readStore();
  const created: Shoe = { id: randomUUID(), ...shoe };
  store.shoes.push(created);
  await writeStore(store);
  return created;
}

export async function saveRecommendation(
  recommendation: DailyRecommendation,
): Promise<void> {
  const store = await readStore();
  const filtered = store.recommendations.filter(
    (item) => item.date !== recommendation.date,
  );
  filtered.push(recommendation);
  store.recommendations = filtered;
  await writeStore(store);
}
