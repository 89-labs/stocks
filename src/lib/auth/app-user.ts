import { connectMongoose } from "@/lib/db/mongoose";
import { AppUser } from "@/lib/db/models";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signUpSchema, signInCredentialsSchema } from "@/lib/auth/validation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function formatZodError(err: { issues: { message: string }[] }): string {
  return err.issues[0]?.message ?? "Invalid input";
}

export async function registerAppUser(input: unknown): Promise<
  { ok: true; user: AuthUser } | { ok: false; error: string }
> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const { username, email, password } = parsed.data;
  const usernameLower = username.toLowerCase();

  if (!process.env.MONGODB_URI) {
    return { ok: false, error: "Database is not configured. Set MONGODB_URI in .env." };
  }

  await connectMongoose();

  const existingEmail = await AppUser.findOne({ email }).lean();
  if (existingEmail) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const existingUsername = await AppUser.findOne({ username: usernameLower }).lean();
  if (existingUsername) {
    return { ok: false, error: "This username is already taken." };
  }

  const passwordHash = await hashPassword(password);

  const doc = await AppUser.create({
    username: usernameLower,
    usernameDisplay: username,
    email,
    passwordHash,
  });

  const userId = doc._id.toString();
  await ensureUserPreferences(userId, username);

  return {
    ok: true,
    user: {
      id: userId,
      name: username,
      email,
    },
  };
}

export async function authenticateAppUser(
  input: unknown
): Promise<AuthUser | null> {
  const parsed = signInCredentialsSchema.safeParse(input);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  if (!process.env.MONGODB_URI) return null;

  await connectMongoose();

  const doc = await AppUser.findOne({ email }).select("+passwordHash").lean();
  if (!doc?.passwordHash) return null;

  const valid = await verifyPassword(password, doc.passwordHash);
  if (!valid) return null;

  return {
    id: doc._id.toString(),
    name: doc.usernameDisplay ?? doc.username,
    email: doc.email,
  };
}

async function ensureUserPreferences(userId: string, displayName: string) {
  try {
    const { UserPreferences } = await import("@/lib/db/models");
    await UserPreferences.findOneAndUpdate(
      { userId },
      { displayName },
      { upsert: true }
    );
  } catch {
    // Registration still succeeds
  }
}
