import { createClient } from "@/lib/supabase/server";
import { Placeholder } from "@/components/dashboard/placeholder";

export const metadata = { title: "Settings · Visa Guide" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Account
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {(user?.user_metadata?.full_name as string) ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Provider</dt>
            <dd className="text-slate-900 capitalize dark:text-slate-100">
              {(user?.app_metadata?.provider as string) ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">User ID</dt>
            <dd className="break-all font-mono text-xs text-slate-700 dark:text-slate-300">
              {user?.id ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <Placeholder
        title="Preferences"
        description="More settings will appear here."
      />
    </div>
  );
}
