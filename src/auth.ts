import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDb } from "@/lib/mongodb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      googleId: string;
      name: string;
      email: string;
      image: string;
      settings: object;
      friends: string[];
      achievements: string[];
      votes: string[];
    };
  }
}

const authOptions: AuthOptions = {
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
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const db = await getDb();

      const existingUser = await db.collection('users').findOne({ googleId: user.id });

      if (!existingUser) {
        await db.collection('users').insertOne({
          googleId: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          settings: { theme: 'light' },
          friends: [],
          achievements: [],
          votes: []
        });
      } else {
        await db.collection('users').updateOne(
          { googleId: user.id },
          { $set: { lastLogin: new Date() } }
        );
      }

      return true;
    },
    async session({ session, token }) {
      const db = await getDb();

      const dbUser = await db.collection('users').findOne({ googleId: token.sub });

      if (dbUser) {
        session.user = {
            id: dbUser._id.toString(),
            googleId: dbUser.googleId,
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image,
            settings: dbUser.settings,
            friends: dbUser.friends,
            achievements: dbUser.achievements,
            votes: dbUser.votes,
        };
      }

      return session;
    },
  },
};

/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
const getSession = () => getServerSession(authOptions);

export { authOptions, getSession };
