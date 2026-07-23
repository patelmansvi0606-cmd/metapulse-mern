import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * The original kept `auth.users` (Supabase-managed) and `public.profiles`
 * (app-owned, 1:1) separate specifically so app-specific fields never
 * touched Supabase's auth schema. There's no external auth schema here
 * to protect that boundary from, so the honest translation is one
 * collection — splitting it into two Mongo collections would just be
 * re-adding a join for no reason.
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never comes back on a normal .find()/.findOne() — must opt in with .select('+passwordHash')
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// toJSON strips the hash even on the rare query that opted into selecting it,
// so a stray `res.json(user)` can never leak it.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
