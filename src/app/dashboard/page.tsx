import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ACCESS_EXPIRES_AT } from "@/lib/config";
import { CountdownTimer } from "@/components/dashboard/countdown-timer";
import {
  VISA_CHECKLIST,
  visibleIdsFor,
  type FundingType,
} from "@/lib/visa-checklist";
import {
  VISA_STEPS,
  computeStepCompletions,
  currentStep,
} from "@/lib/visa-steps";

export const metadata = { title: "Dashboard · Visa Guide" };

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  access_expires_at: string | null;
  created_at: string;
};

type ProgressRow = {
  funding_type: FundingType | null;
  checked_items: string[] | null;
  step_tasks: string[] | null;
};

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let funding: FundingType = "undecided";
  let checkedDocs = new Set<string>();
  let doneStepTaskIds = new Set<string>();

  if (user) {
    const [{ data: pData }, { data: prog }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("checklist_progress")
        .select("funding_type, checked_items, step_tasks")
        .eq("user_id", user.id)
        .maybeSingle<ProgressRow>(),
    ]);
    profile = (pData as Profile | null) ?? null;
    if (prog) {
      funding = (prog.funding_type ?? "undecided") as FundingType;
      checkedDocs = new Set(
        Array.isArray(prog.checked_items) ? prog.checked_items : []
      );
      doneStepTaskIds = new Set(
        Array.isArray(prog.step_tasks) ? prog.step_tasks : []
      );
    }
  }

  // Documents progress (filtered by funding type).
  const visibleDocIds = visibleIdsFor(funding);
  const docDone = Array.from(checkedDocs).filter((id) =>
    visibleDocIds.has(id)
  ).length;
  const docTotal = visibleDocIds.size;
  const docPercent =
    docTotal === 0 ? 0 : Math.round((docDone / docTotal) * 100);

  // Steps progress (counts the documents step via its linked progress).
  const completions = computeStepCompletions({
    doneStepTaskIds,
    linkedDocumentsProgress: { done: docDone, total: docTotal },
  });
  const stepsTotal = VISA_STEPS.length;
  const stepsDone = completions.filter((c) => c.isComplete).length;
  const current = currentStep(completions);
  const allDone = stepsDone === stepsTotal;

  // Top "Next actions" — pull a few unfinished tasks from the current step.
  const nextTasks = current.step.tasks
    .filter((t) => !doneStepTaskIds.has(t.id))
    .slice(0, 4);

  const expiresAtISO =
    profile?.access_expires_at ?? ACCESS_EXPIRES_AT.toISOString();

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Hi {firstName} — let&apos;s get your visa sorted
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your progress, deadlines, and next actions in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CurrentStepCard
          stepNumber={current.step.number}
          stepTitle={current.step.title}
          stepSummary={current.step.summary}
          stepsDone={stepsDone}
          stepsTotal={stepsTotal}
          allDone={allDone}
        />
        <CountdownTimer expiresAtISO={expiresAtISO} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Journey progress"
          value={`${stepsDone} / ${stepsTotal}`}
          hint={`${Math.round((stepsDone / stepsTotal) * 100)}% of steps done`}
          tone="brand"
          progress={Math.round((stepsDone / stepsTotal) * 100)}
          href="/dashboard/steps"
        />
        <StatCard
          label="Documents ready"
          value={docTotal === 0 ? "—" : `${docDone} / ${docTotal}`}
          hint={
            docTotal === 0
              ? "Pick funding type to start"
              : `${docPercent}% collected`
          }
          tone="emerald"
          progress={docPercent}
          href="/dashboard/documents"
        />
        <StatCard
          label="Funding type"
          value={
            funding === "scholarship"
              ? "Scholarship"
              : funding === "self_funded"
                ? "Self-funded"
                : "Undecided"
          }
          hint="Change in document checklist"
          tone="amber"
          href="/dashboard/documents"
        />
        <StatCard
          label="Account status"
          value="Active"
          hint={`Member since ${
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "today"
          }`}
          tone="slate"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Next actions
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {allDone
                ? "Everything is checked off — bon voyage!"
                : `Things to do for step ${current.step.number}: ${current.step.title}.`}
            </p>
          </div>
          <Link
            href={`/dashboard/steps#step-${current.step.id}`}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
          >
            Open step →
          </Link>
        </div>

        <ul className="mt-5 space-y-2">
          {current.step.linked ? (
            <li className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <span>
                {docDone} of {docTotal || 0} documents collected on the
                checklist.
              </span>
              <Link
                href="/dashboard/documents"
                className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Open checklist
              </Link>
            </li>
          ) : nextTasks.length > 0 ? (
            nextTasks.map((task, i) => (
              <li
                key={task.id}
                className="flex items-start gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="block">{task.title}</span>
                  {task.hint ? (
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {task.hint}
                    </span>
                  ) : null}
                </span>
              </li>
            ))
          ) : (
            <li className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-300">
              All tasks for this step are checked.
            </li>
          )}
        </ul>
      </section>

      <JourneyMap completions={completions} />

      <DocumentSnapshot
        funding={funding}
        checkedDocs={checkedDocs}
        docTotal={docTotal}
        docDone={docDone}
      />
    </div>
  );
}

/* ---------------------------- Pieces ---------------------------- */

function CurrentStepCard({
  stepNumber,
  stepTitle,
  stepSummary,
  stepsDone,
  stepsTotal,
  allDone,
}: {
  stepNumber: number;
  stepTitle: string;
  stepSummary: string;
  stepsDone: number;
  stepsTotal: number;
  allDone: boolean;
}) {
  const percent = Math.round((stepsDone / stepsTotal) * 100);
  return (
    <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-100/80">
          {allDone ? "All done" : `You're on step ${stepNumber} of ${stepsTotal}`}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {allDone ? "All steps complete" : stepTitle}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-brand-100/90">
          {allDone
            ? "Your visa journey is fully tracked. Bon voyage!"
            : stepSummary}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-brand-100/80">
            <span>Journey</span>
            <span className="font-semibold tabular-nums">
              {stepsDone}/{stepsTotal} ({percent}%)
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/dashboard/steps"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
          >
            Continue journey
            <ArrowRight />
          </Link>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
          >
            Open document checklist
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  progress,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "emerald" | "brand" | "amber" | "slate";
  progress?: number;
  href?: string;
}) {
  const tones: Record<string, string> = {
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    brand:
      "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
    slate:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };
  const bars: Record<string, string> = {
    emerald: "from-emerald-400 to-emerald-500",
    brand: "from-brand-400 to-brand-600",
    amber: "from-amber-400 to-amber-500",
    slate: "from-slate-400 to-slate-500",
  };

  const inner = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}
        >
          {tone === "emerald" ? "live" : "info"}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${bars[tone]} transition-[width] duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function JourneyMap({
  completions,
}: {
  completions: ReturnType<typeof computeStepCompletions>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Your visa journey
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Six stages from EEF to landing in France.
          </p>
        </div>
        <Link
          href="/dashboard/steps"
          className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          View all →
        </Link>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {completions.map((c) => {
          const status = c.isComplete
            ? "complete"
            : c.done > 0
              ? "in-progress"
              : "upcoming";
          return (
            <li key={c.step.id}>
              <Link
                href={`/dashboard/steps#step-${c.step.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <SmallDot status={status} number={c.step.number} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step {c.step.number}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {c.step.title}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {c.done}/{c.total}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      status === "complete"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : status === "in-progress"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {status === "complete"
                      ? "Done"
                      : status === "in-progress"
                        ? "In progress"
                        : "Upcoming"}
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-500"
                    style={{
                      width: `${
                        c.total === 0 ? 0 : Math.round((c.done / c.total) * 100)
                      }%`,
                    }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SmallDot({
  status,
  number,
}: {
  status: "complete" | "in-progress" | "upcoming";
  number: number;
}) {
  if (status === "complete") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
        {number}
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
      {number}
    </span>
  );
}

function DocumentSnapshot({
  funding,
  checkedDocs,
  docTotal,
  docDone,
}: {
  funding: FundingType;
  checkedDocs: Set<string>;
  docTotal: number;
  docDone: number;
}) {
  // Take a small per-category snapshot.
  const visibleIds = visibleIdsFor(funding);
  const cats = VISA_CHECKLIST.map((cat) => {
    const total = cat.items.filter((i) => visibleIds.has(i.id)).length;
    const done = cat.items.filter(
      (i) => visibleIds.has(i.id) && checkedDocs.has(i.id)
    ).length;
    return { id: cat.id, title: cat.title, done, total };
  }).filter((c) => c.total > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Document snapshot
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {docTotal === 0
              ? "Pick a funding type in the document checklist to load items."
              : `${docDone} of ${docTotal} documents collected so far.`}
          </p>
        </div>
        <Link
          href="/dashboard/documents"
          className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Open checklist →
        </Link>
      </div>

      {cats.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => {
            const pct = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
            return (
              <li
                key={c.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {c.title}
                  </p>
                  <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {c.done}/{c.total}
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function ArrowRight() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
