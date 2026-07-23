import { User } from "@metapulse/db";
import { verifyAuthToken } from "../utils/jwt.js";

const COOKIE_NAME = "mp_session";

/**
 * Reads the JWT from an httpOnly cookie — not an Authorization header —
 * so the React client never touches the token directly (mirrors the
 * original's cookie-based Supabase SSR session, and closes off the
 * usual XSS-steals-localStorage-token path).
 *
 * On success, attaches req.user (the full Mongoose doc, minus
 * passwordHash) and req.userId (string, convenience for query filters).
 * On failure, calls next() with no req.user set — requireAuth (below)
 * is what actually blocks the request. Splitting these means routes
 * that are *optionally* personalized can use this alone.
 */
export async function attachUser(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const payload = verifyAuthToken(token);
    if (!payload?.sub) return next();

    const user = await User.findById(payload.sub);
    if (!user) return next();

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: "UNAUTHENTICATED", message: "Sign in required" },
    });
  }
  next();
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d — keep in sync with JWT_EXPIRES_IN
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}
