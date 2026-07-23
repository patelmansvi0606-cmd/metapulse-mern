import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signAuthToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

/** Returns the decoded payload, or null if missing/expired/invalid — never throws. */
export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    return null;
  }
}
