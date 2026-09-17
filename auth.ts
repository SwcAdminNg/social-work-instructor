import NextAuth, { CredentialsSignin, type DefaultSession, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type LoginUser = User & {
  username?: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type SessionUpdate = {
  action?: string;
  profile_picture_url?: string | null;
};

type AppSession = DefaultSession & {
  accessToken?: unknown;
  expiresAt?: unknown;
  error?: unknown;
  user: DefaultSession["user"] & {
    id?: string;
    username?: string | null;
    image?: string | null;
  };
};

class CustomAuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
        keep_logged_in: { label: "Keep Logged In", type: "text" },
        mode: { label: "Mode", type: "text" },
        session: { label: "Session", type: "text" },
      },
      async authorize(credentials) {
        // Completes sign-in with tokens already issued by a finished 2FA
        // setup/verify exchange, instead of re-authenticating with a password.
        if (credentials?.mode === "finalize" && typeof credentials.session === "string") {
          try {
            const parsed = JSON.parse(credentials.session);
            const authUser = parsed?.user;
            const tokens = parsed?.tokens;

            if (!authUser?.id || !tokens?.access_token) {
              throw new CustomAuthError("Invalid session data");
            }

            return {
              id: authUser.id,
              name: `${authUser.first_name} ${authUser.last_name}`,
              email: authUser.email,
              image: authUser.profile_picture_url,
              username: authUser.username,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600),
            } satisfies LoginUser;
          } catch (error) {
            if (error instanceof CredentialsSignin) {
              throw error;
            }
            throw new CustomAuthError("Invalid session data");
          }
        }

        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";

        try {
          const res = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
              keep_logged_in: credentials.keep_logged_in === "true",
            }),
          });

          const response = await res.json();

          if (res.ok && response.data?.user) {
            return {
              id: response.data.user.id,
              name: `${response.data.user.first_name} ${response.data.user.last_name}`,
              email: response.data.user.email,
              image: response.data.user.profile_picture_url,
              username: response.data.user.username,
              accessToken: response.data.tokens.access_token,
              refreshToken: response.data.tokens.refresh_token,
              expiresAt: Math.floor(Date.now() / 1000) + (response.data.tokens.expires_in || 3600),
            } satisfies LoginUser;
          }

          throw new CustomAuthError(
            response.message || "Invalid credentials provided",
          );
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          console.error(
            "Login error:",
            error instanceof Error ? error.message : error,
          );
          throw new CustomAuthError(
            "An unexpected error occurred during login",
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const loginUser = user as LoginUser;
        token.id = user.id;
        token.picture = loginUser.image ?? null;
        token.username = loginUser.username;
        token.accessToken = loginUser.accessToken;
        token.refreshToken = loginUser.refreshToken;
        token.expiresAt = loginUser.expiresAt;
      } 
      
      // Explicit manual refresh triggered by the client modal
      else if (trigger === "update" && (session as SessionUpdate | undefined)?.action === "refresh") {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";
          const res = await fetch(`${baseUrl}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
          });
          const response = await res.json().catch(() => ({}));
          
          if (res.ok && response.data?.access_token) {
            token.accessToken = response.data.access_token;
            token.refreshToken = response.data.refresh_token;
            token.expiresAt = Math.floor(Date.now() / 1000) + (response.data.expires_in || 3600);
            token.error = undefined;
          } else {
            token.error = "RefreshAccessTokenError";
          }
        } catch (error) {
          console.error("Error refreshing access token", error);
          token.error = "RefreshAccessTokenError";
        }
      } else if (trigger === "update" && "profile_picture_url" in (session ?? {})) {
        token.picture = (session as SessionUpdate).profile_picture_url ?? null;
      } 
      // If token is expired and NO manual refresh was triggered, flag it as error so client logs out
      else if (token.expiresAt && Math.floor(Date.now() / 1000) > (token.expiresAt as number)) {
        token.error = "RefreshAccessTokenError";
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        const appSession = session as AppSession;
        appSession.user.id = token.id as string;
        appSession.user.image = token.picture as string | null | undefined;
        appSession.user.username = token.username as string;
        appSession.accessToken = token.accessToken;
        appSession.expiresAt = token.expiresAt; // Pass expiry time to client
        appSession.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "fallback-secret-do-not-use-in-production",
  trustHost: true,
});
