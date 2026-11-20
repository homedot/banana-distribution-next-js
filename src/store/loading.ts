/**
 * Global "working…" state behind the full-screen loading overlay.
 *
 * Wrap any save / edit / update / delete in `withLoading(message, fn)` and the
 * overlay covers the app until it settles. Lives outside React so it can be
 * used from the data store, the login screen and logout without providers.
 */

/** Keep the overlay up at least this long so quick saves don't just flash. */
const MIN_VISIBLE_MS = 450;

type Listener = () => void;

let jobs: { id: number; message: string }[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeLoading(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Message of the most recent running job, or null when idle. */
export function getLoadingMessage(): string | null {
  return jobs.length ? jobs[jobs.length - 1].message : null;
}

export function getServerLoadingMessage(): string | null {
  return null;
}

export async function withLoading<T>(message: string, fn: () => Promise<T>): Promise<T> {
  const id = nextId++;
  jobs = [...jobs, { id, message }];
  emit();
  const started = Date.now();
  try {
    return await fn();
  } finally {
    const wait = MIN_VISIBLE_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    jobs = jobs.filter((j) => j.id !== id);
    emit();
  }
}
