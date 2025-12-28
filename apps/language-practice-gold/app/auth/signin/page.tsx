import { signIn } from "@/auth"
import { redirect } from "next/navigation"
import { SignInForm } from "./SignInForm"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params?.error

  async function handleSubmit(formData: FormData) {
    "use server"
    
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    
    try {
      await signIn("credentials", {
        username,
        password,
        redirect: false,
      })
      
      redirect("/")
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error
      }
      
      redirect("/auth/signin?error=Invalid credentials")
      return
    }
  }

  return <SignInForm error={error} handleSubmit={handleSubmit} />
}
