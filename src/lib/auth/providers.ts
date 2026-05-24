export type AuthProviderId = "google" | "email" | "credentials";

export interface AuthProviderMeta {
  id: AuthProviderId;
  name: string;
  description: string;
}

const PROVIDER_META: Record<AuthProviderId, Omit<AuthProviderMeta, "id">> = {
  google: {
    name: "Google",
    description: "Sign in with your Google account",
  },
  email: {
    name: "Email",
    description: "We'll send you a magic link — no password needed",
  },
  credentials: {
    name: "Instant access",
    description: "Continue without email or OAuth verification",
  },
};

/** Dev-only instant login — set DEV_AUTH_ENABLED=true in .env */
export function isDevAuthEnabled(): boolean {
  if (process.env.DEV_AUTH_ENABLED === "true") return true;
  return process.env.NODE_ENV === "development" && Boolean(process.env.NEXTAUTH_SECRET);
}

export function getConfiguredProviders(): AuthProviderMeta[] {
  const providers: AuthProviderMeta[] = [];

  if (isDevAuthEnabled()) {
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

export const DEV_USER_ID = "dev-local-user";
