// in auth.ts

import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google"

const authOptions : AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET as string,
    providers: [
      GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
            }
          },
        })
    ],
  }

/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
const getSession = () => getServerSession(authOptions)

export { authOptions, getSession }