import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validUsername = process.env.AUTH_USERNAME
        const validPassword = process.env.AUTH_PASSWORD
        
        if (!validUsername || !validPassword) {
          throw new Error("Authentication not configured")
        }
        
        if (
          credentials?.username === validUsername &&
          credentials?.password === validPassword
        ) {
          return {
            id: "1",
            name: validUsername,
            email: `${validUsername}@app.local`,
          }
        }
        
        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAuthPage = nextUrl.pathname.startsWith('/auth')
      const isOnApiRoute = nextUrl.pathname.startsWith('/api')
      
      // Allow access to auth pages and API routes
      if (isOnAuthPage || isOnApiRoute) {
        return true
      }
      
      // Require authentication for all other routes
      if (!isLoggedIn) {
        return false // This will trigger redirect to signIn page
      }
      
      return true
    },
  },
} satisfies NextAuthConfig

