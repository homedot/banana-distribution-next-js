let fallbackCounter = 0;

export function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  fallbackCounter += 1;
  return `${prefix}_${Date.now()}_${fallbackCounter}`;
}
