import bcrypt from "bcryptjs";

/** Workers use a short numeric PIN instead of a password — 4 to 6 digits. */
export const PIN_PATTERN = /^\d{4,6}$/;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

/** Normalizes a phone number for comparison/storage (digits only). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
