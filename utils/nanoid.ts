import { randomBytes } from "crypto";

export function nanoid(size = 8): string {
  return randomBytes(size).toString("hex").slice(0, size);
}
