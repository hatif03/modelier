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

async function youcamFetch(path: string, init?: RequestInit) {
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
