import { AuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import { NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      fid: number;
    };
  }
}

interface SignInCredentials {
  message: string;
  signature: string;
  name: string;
  pfp: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sign in with Farcaster",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
        name: {
          label: "Name",
          type: "text",
          placeholder: "0x0",
        },
        pfp: {
          label: "Pfp",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(
        credentials: SignInCredentials | undefined,
        req: any
      ): Promise<{ id: string } | null> {
        if (!credentials) return null;

        const csrfToken = req?.body?.csrfToken;
        const appClient = createAppClient({
          ethereum: viemConnector(),
        });

        const verifyResponse = await appClient.verifySignInMessage({
          message: credentials.message,
          signature: credentials.signature as `0x${string}`,
          domain: new URL(process.env.NEXTAUTH_URL ?? "").hostname,
          nonce: csrfToken,
        });
        const { success, fid } = verifyResponse;

        if (!success) {
          return null;
        }

        return {
          id: fid.toString(),
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session?.user) {
        session.user.fid = parseInt(token.sub ?? "");
      }
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);
