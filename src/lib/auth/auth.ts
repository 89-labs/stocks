import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/db/mongo-client";
import { DEV_USER_ID, getConfiguredProviders, isDevAuthEnabled } from "./providers";

const providers: NextAuthOptions["providers"] = [];

if (isDevAuthEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "Demo",
      credentials: {},
      async authorize() {
        return {
          id: DEV_USER_ID,
          name: "Demo User",
          email: "demo@naijastocks.local",
        };
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

export const authOptions: NextAuthOptions = {
  adapter: buildAdapter(),
  providers,
  pages: {
    signIn: DEFAULT_SIGN_IN,
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
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
      if (!user.id || !process.env.MONGODB_URI) return;
      try {
        const { connectMongoose } = await import("@/lib/db/mongoose");
        const { UserPreferences } = await import("@/lib/db/models");
        await connectMongoose();
        await UserPreferences.findOneAndUpdate(
          { userId: user.id },
          { displayName: user.name ?? undefined },
          { upsert: true }
        );
      } catch {
        // Dev login still works if MongoDB is unavailable
      }
    },
  },
};

export { safeCallbackUrl, DEFAULT_AFTER_SIGN_IN, DEFAULT_SIGN_IN, getConfiguredProviders };
