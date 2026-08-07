// Shared by every avatar in the app — the Liveblocks multiplayer-presence
// avatar (components/users/Avatar.tsx) and the dashboard account menu
// (components/dashboard/UserMenu.tsx) — so there's one hash-to-color
// implementation instead of two copies drifting apart.
export const AVATAR_PALETTE = ["#FF2E7E", "#170014", "#FF8FC0", "#6B1740", "#0B0A0C", "#D6316E"];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function initialsForName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
