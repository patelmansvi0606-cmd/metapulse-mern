import bcrypt from "bcryptjs";

// Pure-JS bcrypt on purpose — the native `bcrypt` package needs node-gyp
// to compile on install, which is exactly the kind of environment-
// specific friction (recall the Windows PATH/encoding issues from the
// original build) worth avoiding when a pure-JS drop-in exists.
const SALT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
