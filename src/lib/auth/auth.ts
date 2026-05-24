import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/db/mongo-client";
import { authenticateAppUser } from "@/lib/auth/app-user";
import { getConfiguredProviders, isCredentialsAuthEnabled } from "./providers";

const providers: NextAuthOptions["providers"] = [];

if (isCredentialsAuthEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await authenticateAppUser({
          email: credentials?.email,
          password: credentials?.password,
        });
        return user;
      },
    })
  );
}

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (googleId && googleSecret && googleId !== "..." && googleSecret !== "...") {
    providers.push(
      GoogleProvider({
        clientId: googleId,
        clientSecret: googleSecret,
      })
    );
  }

const emailHost = process.env.EMAIL_SERVER_HOST?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim();
if (emailHost && emailFrom && emailHost !== "..." && emailFrom !== "...") {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  );
}

function buildAdapter() {
  if (!process.env.MONGODB_URI) return undefined;
  return MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "naijastocks",
  }) as NextAuthOptions["adapter"];
}

const DEFAULT_SIGN_IN = "/auth/signin";
const DEFAULT_SIGN_UP = "/auth/signup";
const DEFAULT_AFTER_SIGN_IN = "/dashboard";

function safeCallbackUrl(url: string, baseUrl: string): string {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    if (parsed.origin === base.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    // fall through
  }
  return DEFAULT_AFTER_SIGN_IN;
}

async function ensureUserPreferences(userId: string, displayName?: string | null) {
  if (!process.env.MONGODB_URI) return;
  try {
    const { connectMongoose } = await import("@/lib/db/mongoose");
    const { UserPreferences } = await import("@/lib/db/models");
    await connectMongoose();
    await UserPreferences.findOneAndUpdate(
      { userId },
      { displayName: displayName ?? undefined },
      { upsert: true }
    );
  } catch {
    // Sign-in still succeeds if MongoDB is unavailable
  }
}

export const authOptions: NextAuthOptions = {
  adapter: buildAdapter(),
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: DEFAULT_SIGN_IN,
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
        session.user.email = (token.email as string | undefined) ?? session.user.email;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}${DEFAULT_AFTER_SIGN_IN}`;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      const displayName = user.name ?? user.email?.split("@")[0] ?? undefined;
      await ensureUserPreferences(user.id, displayName);
    },
  },
};

export {
  safeCallbackUrl,
  DEFAULT_AFTER_SIGN_IN,
  DEFAULT_SIGN_IN,
  DEFAULT_SIGN_UP,
  getConfiguredProviders,
};
