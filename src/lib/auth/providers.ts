export type AuthProviderId = "google" | "email" | "credentials";

export interface AuthProviderMeta {
  id: AuthProviderId;
  name: string;
  description: string;
}

const PROVIDER_META: Record<AuthProviderId, Omit<AuthProviderMeta, "id">> = {
  google: {
    name: "Google",
    description: "Sign up or sign in with your Google account",
  },
  email: {
    name: "Email",
    description: "We'll send you a magic link — no password needed",
  },
  credentials: {
    name: "Email & password",
    description: "Sign in with your username and password",
  },
};

/** Email/password accounts stored in MongoDB */
export function isCredentialsAuthEnabled(): boolean {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim() && process.env.MONGODB_URI?.trim());
}

/** Google OAuth (requires MongoDB adapter + client credentials) */
export function isGoogleAuthEnabled(): boolean {
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(
    process.env.NEXTAUTH_SECRET?.trim() &&
      process.env.MONGODB_URI?.trim() &&
      googleId &&
      googleSecret &&
      googleId !== "..." &&
      googleSecret !== "..."
  );
}

/** Sign-up page can use email/password and/or Google */
export function isRegistrationAvailable(): boolean {
  return isCredentialsAuthEnabled() || isGoogleAuthEnabled();
}

export function getConfiguredProviders(): AuthProviderMeta[] {
  const providers: AuthProviderMeta[] = [];

  if (isCredentialsAuthEnabled()) {
    providers.push({ id: "credentials", ...PROVIDER_META.credentials });
  }

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (googleId && googleSecret && googleId !== "..." && googleSecret !== "...") {
    providers.push({ id: "google", ...PROVIDER_META.google });
  }

  const emailHost = process.env.EMAIL_SERVER_HOST?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  if (emailHost && emailFrom && emailHost !== "..." && emailFrom !== "...") {
    providers.push({ id: "email", ...PROVIDER_META.email });
  }

  return providers;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXTAUTH_SECRET) && getConfiguredProviders().length > 0;
}
