// Supabase Storage (chosen over Vercel Blob since the project already has a
// Supabase project provisioned — same job, one less provider). Server-only:
// uses the service-role key, never expose this client to the browser.
import { createClient } from "@supabase/supabase-js";

const BUCKET = "modelier-public";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceRole) throw new Error("Supabase URL/service role are not set");
  return createClient(url, serviceRole);
}

export async function ensurePublicBucket(): Promise<void> {
  const supabase = client();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
  if (buckets?.some((b) => b.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError) throw new Error(`Failed to create Supabase bucket: ${createError.message}`);
}

// Uploads bytes we control (a seeded reference-model photo, a re-hosted VTO
// result) and returns a stable public URL — unlike YouCam's own result URLs,
// which expire in ~2 hours.
export async function uploadPublicFile(path: string, buffer: Buffer, contentType: string): Promise<string> {
  const supabase = client();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Downloads a YouCam result (image or video) and re-hosts it here — YouCam's
// own result URLs are signed with a ~2-hour expiry (X-Amz-Expires=7200),
// so anything that keeps the raw URL around (a GenerationVariant, a canvas
// layer) goes dead a couple hours after generating. Call this once, right
// when a result first succeeds, and store the returned URL instead.
export async function rehostResultFile(sourceUrl: string, pathWithoutExtension: string): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to download ${sourceUrl} for re-hosting (status ${res.status})`);

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = contentType.includes("video") ? "mp4" : contentType.includes("png") ? "png" : "jpg";

  return uploadPublicFile(`${pathWithoutExtension}.${ext}`, buffer, contentType);
}
