import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET && process.env.NODE_ENV !== "test") {
  // Fail loudly at startup rather than silently signing tokens with an
  // undefined secret, which would make every session forgeable.
  throw new Error("JWT_SECRET environment variable is required");
}

const EFFECTIVE_SECRET = SECRET ?? "test-secret-do-not-use-in-production";

export interface SessionPayload {
  sub: string; // userId
}

const EXPIRES_IN = "30d";

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
