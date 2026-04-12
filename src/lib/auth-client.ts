import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    twoFactorClient({
      twoFactorPage: "/verify-2fa",
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, twoFactor } = authClient;
