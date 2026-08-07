// Adobe Firefly Services client — Magic Expand (Generative Expand) and Magic
// Eraser (Generative Fill with no prompt, painting over the masked region).
// NOT LIVE: this project has no FIREFLY_CLIENT_ID/SECRET yet (see
// .env.example and design.md §9a) — the UI shows these as an upcoming-feature
// badge rather than a working flow (components/panels/ai-model-studio/FlowSelector.tsx),
// so nothing here has been exercised against the real API. Shapes below follow
// Adobe's published REST contract:
// https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/generative_fill/V1/
// https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/generative_expand/V3_Async/
// — verify against a real account before flipping the UI over to "live."
const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const API_BASE = "https://firefly-api.adobe.io";
const SCOPE = "openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis";

export function isFireflyConfigured(): boolean {
  return Boolean(process.env.FIREFLY_CLIENT_ID && process.env.FIREFLY_CLIENT_SECRET);
}

// Cached in-memory for the life of the server process — a fresh token per
// call would work too, but every other provider client in this codebase
// (lib/youcam/client.ts) caches its auth the same way, and Adobe's own docs
// call out caching the ~24h token rather than re-fetching per request.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.accessToken;

  const clientId = process.env.FIREFLY_CLIENT_ID;
  const clientSecret = process.env.FIREFLY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Firefly isn't configured yet — set FIREFLY_CLIENT_ID and FIREFLY_CLIENT_SECRET.");
  }

  const res = await fetch(IMS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: SCOPE,
    }),
  });
  if (!res.ok) throw new Error(`Firefly auth failed (${res.status}): ${await res.text()}`);

  const json = await res.json();
  cachedToken = {
    accessToken: json.access_token,
    // Refresh a little early rather than racing the real expiry.
    expiresAt: Date.now() + (Number(json.expires_in ?? 86400) - 300) * 1000,
  };
  return cachedToken.accessToken;
}

async function fireflyFetch(path: string, init: RequestInit): Promise<any> {
  const [accessToken, clientId] = await Promise.all([getAccessToken(), Promise.resolve(process.env.FIREFLY_CLIENT_ID)]);
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "X-Api-Key": clientId as string,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error(`Firefly API error (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function uploadFireflyImage(buffer: Buffer, contentType: string): Promise<string> {
  const json = await fireflyFetch("/v2/storage/image", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: buffer as unknown as BodyInit,
  });
  const uploadId = json?.images?.[0]?.id;
  if (!uploadId) throw new Error("Firefly upload response didn't include an image id.");
  return uploadId;
}

export type FireflyJob = { jobId?: string; statusUrl?: string; status: string; resultUrl?: string };

// Both endpoints return an async job — poll getFireflyJobStatus with
// whatever `statusUrl` comes back until status is "succeeded"/"failed".
export async function createGenerativeExpandTask(input: {
  sourceUploadId: string;
  size: { width: number; height: number };
  prompt?: string;
}): Promise<FireflyJob> {
  const json = await fireflyFetch("/v3/images/expand-async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      size: input.size,
      image: { source: { uploadId: input.sourceUploadId } },
      ...(input.prompt ? { prompt: input.prompt } : {}),
    }),
  });
  return normalizeJob(json);
}

// Magic Eraser = Generative Fill with an empty prompt — Firefly paints the
// masked region back in as if the removed content was never there.
export async function createGenerativeFillTask(input: {
  sourceUploadId: string;
  maskUploadId: string;
  prompt?: string;
  size: { width: number; height: number };
}): Promise<FireflyJob> {
  const json = await fireflyFetch("/v3/images/fill-async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      numVariations: 1,
      size: input.size,
      prompt: input.prompt ?? "",
      image: {
        source: { uploadId: input.sourceUploadId },
        mask: { uploadId: input.maskUploadId },
      },
    }),
  });
  return normalizeJob(json);
}

export async function getFireflyJobStatus(statusUrl: string): Promise<FireflyJob> {
  const accessToken = await getAccessToken();
  const res = await fetch(statusUrl, {
    headers: { "X-Api-Key": process.env.FIREFLY_CLIENT_ID as string, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Firefly job status error (${res.status}): ${await res.text()}`);
  return normalizeJob(await res.json());
}

function normalizeJob(json: any): FireflyJob {
  return {
    jobId: json?.jobId,
    statusUrl: json?.statusUrl ?? json?.links?.self?.href,
    status: json?.status ?? "running",
    resultUrl: json?.result?.outputs?.[0]?.image?.url ?? json?.outputs?.[0]?.image?.url,
  };
}
