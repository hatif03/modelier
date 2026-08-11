"use client";

// Persists imported media files to the Origin Private File System so a project's
// footage survives a reload without ever being uploaded to a server — the same
// "no uploads, projects stay local" model freecut (MIT) uses. Falls back to
// leaving files as in-memory blob: URLs only (lost on reload) in browsers without
// OPFS support (checked via `isStorageSupported`).

const DIR_NAME = "modelier-video-media";

async function getDir(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) return null;
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(DIR_NAME, { create: true });
}

export function isStorageSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.storage?.getDirectory;
}

export async function saveMediaFile(mediaId: string, file: File | Blob): Promise<void> {
  const dir = await getDir();
  if (!dir) return;
  const handle = await dir.getFileHandle(mediaId, { create: true });
  const writable = await handle.createWritable();
  await writable.write(file);
  await writable.close();
}

export async function loadMediaFile(mediaId: string): Promise<File | null> {
  const dir = await getDir();
  if (!dir) return null;
  try {
    const handle = await dir.getFileHandle(mediaId, { create: false });
    return await handle.getFile();
  } catch {
    return null;
  }
}

export async function deleteMediaFile(mediaId: string): Promise<void> {
  const dir = await getDir();
  if (!dir) return;
  await dir.removeEntry(mediaId).catch(() => {});
}
