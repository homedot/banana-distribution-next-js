import type { AppData } from "@/src/types";
import { seedData } from "@/src/store/seed-data";
import { STORAGE_KEY } from "@/src/utils/constants";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentData: AppData = seedData;
let readFromStorageOnce = false;

function readFromStorage(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      if (parsed && Array.isArray(parsed.distributions)) {
        return parsed as AppData;
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return seedData;
}

function persist(data: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private mode, quota, etc.) - fail silently
  }
}

/** React only calls this on the client, so it's safe to touch localStorage here. */
export function getSnapshot(): AppData {
  if (!readFromStorageOnce) {
    currentData = readFromStorage();
    readFromStorageOnce = true;
  }
  return currentData;
}

/** Used during SSR and for the first client render, so it must stay deterministic. */
export function getServerSnapshot(): AppData {
  return seedData;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function mutate(updater: (prev: AppData) => AppData): AppData {
  currentData = updater(currentData);
  persist(currentData);
  for (const listener of listeners) listener();
  return currentData;
}

export function resetToSeed(): void {
  currentData = seedData;
  readFromStorageOnce = true;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  for (const listener of listeners) listener();
}
