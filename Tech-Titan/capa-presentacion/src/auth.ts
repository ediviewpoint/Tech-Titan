import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Requerido en producción: permite que NextAuth confíe en el host del request
  trustHost: true,
  providers: [
    GitHub({
      clientId:     process.env.GITHUB_ID     ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  // Permite que session.user.id esté disponible en el cliente
  callbacks: {
    session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
});
