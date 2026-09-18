import { randomBytes } from "crypto";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "org";
}

/** Short, URL-safe, human-typeable invite code (e.g. for /join/<code> links). */
export function generateInviteCode(): string {
  return randomBytes(6).toString("base64url").slice(0, 8).toLowerCase();
}

export function buildJoinPath(inviteCode: string): string {
  return `/join/${inviteCode}`;
}
