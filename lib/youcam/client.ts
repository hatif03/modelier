// Generic primitives for the YouCam / Perfect Corp S2S API.
// Every feature (clothes VTO, skin tone analysis, text-to-image, ...) is a thin
// wrapper on top of these three calls — see clothesVto.ts / skinToneAnalysis.ts / textToImage.ts.
// Real, confirmed schema (not guessed): https://docs.perfectcorp.com/develop/introduction

const BASE_URL = "https://yce-api-01.makeupar.com";

function apiKey(): string {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new Error("YOUCAM_API_KEY is not set");
  return key;
}

export class YoucamApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string | undefined,
    public readonly httpStatus: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "YoucamApiError";
  }
}

// PerfectCorp enforces 250 requests / 300s, both per-IP and per-token. A
// simple in-process token bucket is enough at our traffic level — no need
// for a distributed limiter. Requests over the limit wait instead of firing
// and immediately hitting a 429.
const RATE_LIMIT_MAX = 250;
const RATE_LIMIT_WINDOW_MS = 300_000;
const requestTimestamps: number[] = [];

async function waitForRateLimitSlot(): Promise<void> {
  const now = Date.now();
  while (requestTimestamps.length && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length < RATE_LIMIT_MAX) {
    requestTimestamps.push(now);
    return;
  }
  const waitMs = RATE_LIMIT_WINDOW_MS - (now - requestTimestamps[0]) + 50;
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return waitForRateLimitSlot();
}

async function youcamFetch(path: string, init?: RequestInit) {
  await waitForRateLimitSlot();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.error ?? `YouCam request failed with status ${res.status}`;
    throw new YoucamApiError(message, json?.error_code, res.status, json);
  }

  return json;
}

// Shared by every new v2+ feature wrapper (skin.ts, face.ts, body.ts, hair.ts,
// ...) — every one of them takes a source photo as either an already-uploaded
// file_id or a public URL, the same two-way choice clothesVto.ts/jewelryVto.ts
// already hand-roll individually. Collapsing it here avoids repeating the same
// four lines in ~15 near-identical functions.
export type SrcFileInput = { srcFileId?: string; srcFileUrl?: string };
export type RefFileInput = { refFileId?: string; refFileUrl?: string };

export function withSrcFile(payload: Record<string, unknown>, input: SrcFileInput, fnName: string): void {
  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error(`${fnName} requires either srcFileId or srcFileUrl`);
}

export function withRefFile(payload: Record<string, unknown>, input: RefFileInput, fnName: string): void {
  if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;
  else throw new Error(`${fnName} requires either refFileId or refFileUrl`);
}

export type UploadedFile = { fileId: string };

// POST /s2s/v2.0/file — a single generic endpoint shared by every feature
// (NOT per-feature, despite what some third-party writeups imply). Returns a
// pre-signed upload URL; the actual bytes still have to be PUT there.
export async function uploadFile(
  buffer: Buffer,
  meta: { contentType: string; fileName: string }
): Promise<UploadedFile> {
  const json = await youcamFetch("/s2s/v2.0/file", {
    method: "POST",
    body: JSON.stringify({
      files: [{ content_type: meta.contentType, file_name: meta.fileName, file_size: buffer.byteLength }],
    }),
  });

  const file = json.data.files[0];
  const uploadRequest = file.requests[0];

  const putRes = await fetch(uploadRequest.url, {
    method: uploadRequest.method,
    headers: uploadRequest.headers,
    body: buffer as unknown as BodyInit,
  });

  if (!putRes.ok) {
    throw new Error(`Failed to upload file to pre-signed URL (status ${putRes.status})`);
  }

  return { fileId: file.file_id };
}

// POST /s2s/v2.0/task/{feature} — starts an async job, returns a task_id immediately.
export async function createTask(feature: string, payload: Record<string, unknown>): Promise<string> {
  const json = await youcamFetch(`/s2s/v2.0/task/${feature}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json.data.task_id;
}

// GET /s2s/v2.0/task/template/{feature} — a handful of features (hairstyle,
// hair extension/volume/bangs/wavy, beard style, fabric) ship a curated
// template list instead of requiring a user-supplied reference photo.
export async function listTemplates<TTemplate = { id: string; label?: string; thumbnailUrl?: string }>(
  feature: string
): Promise<TTemplate[]> {
  const json = await youcamFetch(`/s2s/v2.0/task/template/${feature}`, { method: "GET" });
  return json.data?.templates ?? [];
}

export type TaskStatus<TResults = unknown> = {
  status: "running" | "success" | "error";
  results?: TResults;
  error?: string;
  errorMessage?: string;
};

// GET /s2s/v2.0/task/{feature}/{taskId} — one status check, no internal retry loop.
// Units are only consumed on a "success" result; "running"/"error" cost nothing —
// safe to poll and safe to fail fast during development.
export async function getTaskStatus<TResults = unknown>(
  feature: string,
  taskId: string
): Promise<TaskStatus<TResults>> {
  const json = await youcamFetch(`/s2s/v2.0/task/${feature}/${taskId}`, { method: "GET" });
  return {
    status: json.data.task_status,
    results: json.data.results,
    error: json.data.error,
    errorMessage: json.data.error_message,
  };
}

// Blocking poll loop — only for one-shot Node scripts (e.g. seed-reference-models.ts).
// The app itself never blocks a request on this; see app/api/generations/[id]/status/route.ts,
// which does one getTaskStatus() check per client-initiated poll instead.
export async function pollTaskUntilDone<TResults = unknown>(
  feature: string,
  taskId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<TaskStatus<TResults>> {
  const interval = opts.intervalMs ?? 2000;
  const timeout = opts.timeoutMs ?? 60000;
  const start = Date.now();

  while (true) {
    const status = await getTaskStatus<TResults>(feature, taskId);
    if (status.status !== "running") return status;
    if (Date.now() - start > timeout) {
      throw new Error(`Polling timed out for ${feature}/${taskId} after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

// Several effects (face-lift, face-reshape, face-swap, teeth-whiten,
// body-reshape, fitzpatrick-scale-analyzer) require a "pre-process" detection
// task to run first, whose result (face/body boxes) feeds the parameters of
// the real task. Pre-process is lightweight detection, not full inference, so
// unlike the main task it's safe to block on synchronously inside the
// `/api/generations` POST handler — it's expected to resolve within a couple
// of polls. The main task submitted after it still follows the app's normal
// non-blocking submit-then-poll pattern.
export async function createTaskWithPreprocess<TPrepResults = unknown>(
  feature: string,
  prepPayload: Record<string, unknown>,
  mapPrepResultToMainPayload: (prepResults: TPrepResults) => Record<string, unknown>,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<string> {
  const prepTaskId = await createTask(`${feature}/pre-process`, prepPayload);
  const prepStatus = await pollTaskUntilDone<TPrepResults>(`${feature}/pre-process`, prepTaskId, opts);

  if (prepStatus.status === "error") {
    throw new YoucamApiError(prepStatus.errorMessage ?? "Pre-process step failed.", prepStatus.error, 502, prepStatus);
  }

  const mainPayload = mapPrepResultToMainPayload(prepStatus.results as TPrepResults);
  return createTask(feature, mainPayload);
}
