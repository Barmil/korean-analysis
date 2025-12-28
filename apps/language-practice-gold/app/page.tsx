import { auth } from "@/app/api/auth/[...nextauth]/route"
import { signOut } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { HomeContent } from "./HomeContent"

export default async function Home() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  async function handleSignOut() {
    "use server"
    await signOut()
  }
  
  return <HomeContent user={session.user || null} handleSignOut={handleSignOut} />
}
