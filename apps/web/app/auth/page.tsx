import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <section className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </section>
    </main>
  )
}
