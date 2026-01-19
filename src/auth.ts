import { getServerSession, type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/passwords";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

      const supabase = getSupabaseAdmin();
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, name, image_url")
        .eq("email", parsed.data.email)
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
        email: user.email,
        name: user.name,
        image: user.image_url ?? undefined,
      };
    },
  })
);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return true;
      }

      const supabase = getSupabaseAdmin();
      await supabase
        .from("users")
        .upsert(
          {
            email: user.email,
            name: user.name ?? "",
            image_url: user.image ?? null,
          },
          { onConflict: "email" }
        );

      const { data: existing } = await supabase
        .from("users")
        .select("privacy_accepted_at, terms_accepted_at")
        .eq("email", user.email)
        .single();

      if (!existing?.privacy_accepted_at || !existing?.terms_accepted_at) {
        return "/consent";
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id && account?.provider !== "google") {
        token.userId = user.id;
      }

      if ((!token.userId || account?.provider === "google") && token.email) {
        const supabase = getSupabaseAdmin();
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("email", token.email)
          .single();
        if (existing?.id) {
          token.userId = existing.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
