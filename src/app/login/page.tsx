import { LoginCard } from "./login-card";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Sign in · Visa Guide",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-brand-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-700/10" />
      </div>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12 lg:flex-row lg:gap-16">
        <section className="mb-10 max-w-xl text-center lg:mb-0 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur dark:border-brand-500/30 dark:bg-slate-900/60 dark:text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Visa Guide
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            Your visa journey,
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              one clear step at a time.
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            Sign in with Google to get personalized, step-by-step guidance through
            your visa process — documents, deadlines, and what to do next.
          </p>
        </section>

        <LoginCard />
      </div>
    </main>
  );
}
