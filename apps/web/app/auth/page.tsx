import { LoginForm } from "@/components/login-form"
import { AnimatedGridPattern } from "@/components/background/animated-grid-pattern"

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      {/*<AnimatedGridPattern
        numSquares={60}
        maxOpacity={0.12}
        duration={10}
        repeatDelay={4}
        className="-skew-y-12 -translate-y-120 text-muted-foreground/80 hidden md:block mask-[radial-gradient(ellipse_80%_60%_at_50%_50%,white_30%,transparent_100%)]"
      />*/}
      <section className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </section>
    </main>
  )
}
