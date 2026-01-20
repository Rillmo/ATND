import { getServerSession, type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { verifyPassword } from "@/lib/passwords";
import { passwordSchema } from "@/lib/validation";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
        },
      },
    })
  );
}

providers.push(
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const email = parsed.data.email.toLowerCase();
      const supabase = getSupabaseAdmin();
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, name, image_url, email_verified_at")
        .eq("email", email)
        .single();

      if (userError || !user) {
        return null;
      }

      const { data: credential } = await supabase
        .from("user_credentials")
        .select("password_hash")
        .eq("user_id", user.id)
        .single();

      if (!credential) {
        return null;
      }

      const matches = await verifyPassword(
        parsed.data.password,
        credential.password_hash
      );

      if (!matches) {
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? email,
        name: user.name,
        image: user.image_url ?? undefined,
      };
    },
  })
);

export const authOptions: NextAuthOptions = {
  debug: process.env.NEXTAUTH_DEBUG === "true",
  logger: {
    error(code, metadata) {
      console.error("[auth:error]", code, metadata);
    },
    warn(code) {
      console.warn("[auth:warn]", code);
    },
    debug(code, metadata) {
      console.log("[auth:debug]", code, metadata);
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== "google") {
          return true;
        }

        if (!user.email) {
          console.error("[auth:signIn] google user missing email");
          return false;
        }

        const email = user.email.toLowerCase();
        (user as typeof user).email = email;

        const googleProfile = profile as { email_verified?: boolean } | null;
        const isEmailVerified =
          typeof googleProfile?.email_verified === "boolean"
            ? googleProfile.email_verified
            : true;

        if (!isEmailVerified) {
          console.error("[auth:signIn] google email not verified", {
            email: user.email,
          });
          return false;
        }

        const supabase = getSupabaseAdmin();
        const nowIso = new Date().toISOString();
        const updates: Database["public"]["Tables"]["users"]["Insert"] = {
          email,
          name: user.name ?? "",
          image_url: user.image ?? null,
        };

        if (isEmailVerified) {
          updates.email_verified_at = nowIso;
        }

        const { error: upsertError } = await supabase
          .from("users")
          .upsert(updates, { onConflict: "email" });

        if (upsertError) {
          console.error("[auth:signIn] user upsert failed", upsertError);
          return false;
        }

        const { data: existing, error: consentError } = await supabase
          .from("users")
          .select("privacy_accepted_at, terms_accepted_at")
          .eq("email", email)
          .single();

        if (consentError) {
          console.error("[auth:signIn] consent lookup failed", consentError);
          return false;
        }

        const needsConsent =
          !existing?.privacy_accepted_at || !existing?.terms_accepted_at;
        (
          user as typeof user & {
            needsConsent?: boolean;
          }
        ).needsConsent = needsConsent;

        return true;
      } catch (error) {
        console.error("[auth:signIn] unexpected error", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      try {
        const userWithConsent = user as
          | (typeof user & { needsConsent?: boolean })
          | undefined;

        if (userWithConsent?.email) {
          token.email = userWithConsent.email.toLowerCase();
        }

        const shouldLookupUser =
          Boolean(account?.provider && token.email) ||
          (!token.userId && token.email) ||
          token.needsConsent === true;

        if (shouldLookupUser && token.email) {
          const supabase = getSupabaseAdmin();
          const { data: existing, error: userError } = await supabase
            .from("users")
            .select("id, privacy_accepted_at, terms_accepted_at")
            .eq("email", token.email)
            .single();

          if (userError) {
            console.error("[auth:jwt] user lookup failed", userError);
          }

          if (existing?.id) {
            token.userId = existing.id;
            token.needsConsent =
              !existing.privacy_accepted_at || !existing.terms_accepted_at;
          }
        } else if (userWithConsent?.id && account?.provider !== "google") {
          token.userId = userWithConsent.id;
        }

        if (typeof userWithConsent?.needsConsent === "boolean") {
          token.needsConsent = userWithConsent.needsConsent;
        }

        return token;
      } catch (error) {
        console.error("[auth:jwt] unexpected error", error);
        return token;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.userId) {
          session.user.id = token.userId as string;
        }

        if (typeof token.needsConsent === "boolean") {
          session.user.needsConsent = token.needsConsent;
        }
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log("[auth:event] signIn", {
        provider: message.account?.provider,
        userId: message.user?.id,
        email: message.user?.email,
      });
    },
    async signOut(message) {
      console.log("[auth:event] signOut", {
        session: Boolean(message.session),
        token: Boolean(message.token),
      });
    },
    async session(message) {
      console.log("[auth:event] session", {
        userId: message.session?.user?.id,
        email: message.session?.user?.email,
      });
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
