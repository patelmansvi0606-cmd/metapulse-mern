import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signupSchema, loginSchema } from "@metapulse/schemas";
import { User, ConflictError } from "@metapulse/db";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAuthToken } from "../utils/jwt.js";
import {
  attachUser,
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
} from "../middleware/auth.js";

export const authRouter = Router();

// Credential-guessing protection on the two endpoints where it matters.
// Generous enough not to lock out a real user fumbling their password.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password, fullName } = signupSchema.parse(req.body);

    const existing = await User.findOne({ email });
    if (existing)
      throw new ConflictError("An account with this email already exists");

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, fullName });

    const token = signAuthToken(user._id);
    setSessionCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select("+passwordHash");
    // Same message for "no such user" and "wrong password" — deliberately,
    // so a login attempt can't be used to enumerate registered emails.
    const invalid = () =>
      res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email or password",
        },
      });

    if (!user) return invalid();
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return invalid();

    const token = signAuthToken(user._id);
    setSessionCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", attachUser, requireAuth, (req, res) => {
  res.json({ user: req.user });
});
