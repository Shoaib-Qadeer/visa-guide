"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  VISA_STEPS,
  type VisaStep,
  type StepIcon,
} from "@/lib/visa-steps";
import { saveStepProgress } from "@/lib/actions/progress";

type Props = {
  initialStepTasks: string[];
  documentsProgress: { done: number; total: number };
  initialActiveStepId?: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function VisaStepsTracker({
  initialStepTasks,
  documentsProgress,
  initialActiveStepId,
}: Props) {
  const [done, setDone] = useState<Set<string>>(() => new Set(initialStepTasks));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [, startTransition] = useTransition();

  // Per-step completion derived from the `done` set + documents progress.
  const completions = useMemo(() => {
    return VISA_STEPS.map((step) => {
      if (step.linked && step.linked.kind === "documents") {
        const { done: d, total: t } = documentsProgress;
        return {
          step,
          done: d,
          total: t,
          isComplete: t > 0 && d === t,
        };
      }
      const total = step.tasks.length;
      const doneCount = step.tasks.filter((t) => done.has(t.id)).length;
      return {
        step,
        done: doneCount,
        total,
        isComplete: total > 0 && doneCount === total,
      };
    });
  }, [done, documentsProgress]);

  const totalTasks = useMemo(
    () => completions.reduce((acc, c) => acc + c.total, 0),
    [completions]
  );
  const doneTasks = useMemo(
    () => completions.reduce((acc, c) => acc + c.done, 0),
    [completions]
  );
  const overallPercent =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  // First not-completed step (current focus).
  const currentIndex = useMemo(() => {
    const i = completions.findIndex((c) => !c.isComplete);
    return i === -1 ? completions.length - 1 : i;
  }, [completions]);

  const currentStepId = completions[currentIndex]?.step.id;

  // Active (expanded) step. Defaults to the current step, can be changed by clicking.
  const [activeId, setActiveId] = useState<string>(
    initialActiveStepId ?? currentStepId ?? VISA_STEPS[0].id
  );

  // Debounced save
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await saveStepProgress({ stepTasks: Array.from(done) });
        setSaveState(res.ok ? "saved" : "error");
        if (res.ok) {
          setTimeout(
            () => setSaveState((s) => (s === "saved" ? "idle" : s)),
            1500
          );
        }
      });
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function toggleTask(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function checkAllInStep(step: VisaStep, value: boolean) {
    setDone((prev) => {
      const next = new Set(prev);
      for (const t of step.tasks) {
        if (value) next.add(t.id);
        else next.delete(t.id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <Hero
        currentIndex={currentIndex}
        completions={completions}
        doneTasks={doneTasks}
        totalTasks={totalTasks}
        percent={overallPercent}
        saveState={saveState}
      />

      <Stepper
        completions={completions}
        activeId={activeId}
        currentId={currentStepId}
        onSelect={setActiveId}
      />

      <div className="space-y-4">
        {completions.map((c) => {
          const isActive = c.step.id === activeId;
          const status: StepStatus = c.isComplete
            ? "complete"
            : c.step.id === currentStepId
              ? "current"
              : c.done > 0
                ? "in-progress"
                : "upcoming";
          return (
            <StepCard
              key={c.step.id}
              step={c.step}
              done={c.done}
              total={c.total}
              status={status}
              expanded={isActive}
              onExpand={() => setActiveId(isActive ? "" : c.step.id)}
              onToggleTask={toggleTask}
              onCheckAll={(v) => checkAllInStep(c.step, v)}
              isTaskDone={(id) => done.has(id)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------- Hero -------------------------------- */

function Hero({
  currentIndex,
  completions,
  doneTasks,
  totalTasks,
  percent,
  saveState,
}: {
  currentIndex: number;
  completions: ReturnType<typeof Object>[] & { step: VisaStep; done: number; total: number; isComplete: boolean }[];
  doneTasks: number;
  totalTasks: number;
  percent: number;
  saveState: SaveState;
}) {
  const current = completions[currentIndex];
  const allDone = percent === 100 && totalTasks > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-100/80">
              France · Student Visa Journey
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {allDone ? "All steps complete" : `Step ${current.step.number} · ${current.step.title}`}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-brand-100/90">
              {allDone
                ? "Congrats — your visa journey is fully tracked. Bon voyage!"
                : current.step.summary}
            </p>
          </div>
          <SaveBadge state={saveState} />
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-brand-100/80">Overall progress</p>
            <p className="text-sm font-semibold tabular-nums">
              {doneTasks} / {totalTasks}{" "}
              <span className="text-brand-200/80">({percent}%)</span>
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Stepper ------------------------------- */

function Stepper({
  completions,
  activeId,
  currentId,
  onSelect,
}: {
  completions: { step: VisaStep; done: number; total: number; isComplete: boolean }[];
  activeId: string;
  currentId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Visa steps"
      className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <ol className="flex min-w-max items-stretch gap-2">
        {completions.map((c, i) => {
          const active = c.step.id === activeId;
          const isCurrent = c.step.id === currentId;
          return (
            <li key={c.step.id} className="flex items-stretch">
              <button
                type="button"
                onClick={() => onSelect(c.step.id)}
                className={`flex min-w-[170px] flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <StepDot
                    state={c.isComplete ? "complete" : isCurrent ? "current" : c.done > 0 ? "in-progress" : "upcoming"}
                    number={c.step.number}
                  />
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      c.isComplete
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                          ? "text-brand-700 dark:text-brand-300"
                          : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {c.isComplete ? "Done" : isCurrent ? "Current" : "Upcoming"}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {c.step.title}
                </span>
                <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {c.done}/{c.total} tasks
                </span>
              </button>
              {i < completions.length - 1 ? (
                <div className="mx-1 my-auto h-px w-3 bg-slate-200 dark:bg-slate-700" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepDot({
  state,
  number,
}: {
  state: "complete" | "current" | "in-progress" | "upcoming";
  number: number;
}) {
  if (state === "complete") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
        <CheckMini />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
        {number}
        <span className="absolute -inset-1 animate-ping rounded-full bg-brand-500/40" />
      </span>
    );
  }
  if (state === "in-progress") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">
        {number}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      {number}
    </span>
  );
}

/* -------------------------------- StepCard ------------------------------ */

type StepStatus = "complete" | "current" | "in-progress" | "upcoming";

function StepCard({
  step,
  done,
  total,
  status,
  expanded,
  onExpand,
  onToggleTask,
  onCheckAll,
  isTaskDone,
}: {
  step: VisaStep;
  done: number;
  total: number;
  status: StepStatus;
  expanded: boolean;
  onExpand: () => void;
  onToggleTask: (id: string) => void;
  onCheckAll: (v: boolean) => void;
  isTaskDone: (id: string) => boolean;
}) {
  const allDone = total > 0 && done === total;

  const cardRing =
    status === "current"
      ? "ring-1 ring-brand-200 dark:ring-brand-500/30"
      : "";

  return (
    <section
      id={`step-${step.id}`}
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900 ${cardRing}`}
    >
      <header
        onClick={onExpand}
        className="flex cursor-pointer items-start gap-3 px-5 py-4 sm:gap-4"
      >
        <StepIconBadge icon={step.icon} status={status} number={step.number} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {step.title}
            </h2>
            <StatusPill status={status} />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {done}/{total}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {step.summary}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <ClockMini />
            {step.duration}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {step.tasks.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCheckAll(!allDone);
              }}
              className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:inline-flex"
            >
              {allDone ? "Uncheck all" : "Check all"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            aria-label={expanded ? "Collapse" : "Expand"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Chevron className={expanded ? "rotate-180" : ""} />
          </button>
        </div>
      </header>

      {expanded ? (
        <div className="animate-fade-in border-t border-slate-100 dark:border-slate-800">
          {step.linked ? (
            <LinkedDocumentsBlock
              done={done}
              total={total}
              route={step.linked.route}
              label={step.linked.label}
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {step.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  checked={isTaskDone(task.id)}
                  onToggle={() => onToggleTask(task.id)}
                />
              ))}
            </ul>
          )}

          {step.resources && step.resources.length > 0 ? (
            <ResourceList resources={step.resources} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function StatusPill({ status }: { status: StepStatus }) {
  const styles: Record<StepStatus, string> = {
    complete:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    current:
      "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    "in-progress":
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    upcoming:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  const labels: Record<StepStatus, string> = {
    complete: "Done",
    current: "Current",
    "in-progress": "In progress",
    upcoming: "Upcoming",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* --------------------------------- Tasks --------------------------------- */

function TaskRow({
  task,
  checked,
  onToggle,
}: {
  task: { id: string; title: string; hint?: string };
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label
        className={`group flex cursor-pointer items-start gap-3 px-5 py-3.5 transition ${
          checked
            ? "bg-emerald-50/40 dark:bg-emerald-500/5"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <CheckBox checked={checked} onChange={onToggle} />
        <div className="min-w-0 flex-1">
          <span
            className={`text-sm font-medium ${
              checked
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {task.title}
          </span>
          {task.hint ? (
            <p
              className={`mt-1 text-xs ${
                checked
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {task.hint}
            </p>
          ) : null}
        </div>
      </label>
    </li>
  );
}

function CheckBox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <span className="relative mt-0.5 inline-flex h-5 w-5 flex-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition checked:border-emerald-500 checked:bg-emerald-500 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-offset-slate-900"
      />
      {checked ? (
        <svg
          className="pointer-events-none absolute left-0 top-0 h-5 w-5 animate-scale-in p-0.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : null}
    </span>
  );
}

/* ------------------------------- Linked block ----------------------------- */

function LinkedDocumentsBlock({
  done,
  total,
  route,
  label,
}: {
  done: number;
  total: number;
  route: string;
  label: string;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = total > 0 && done === total;
  return (
    <div className="space-y-3 px-5 py-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {allDone
                ? "All documents collected"
                : total === 0
                  ? "Pick your funding type to load documents"
                  : `${done} of ${total} documents collected`}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              The full embassy checklist with photos, copies, and quantities
              lives in the Documents tab. Tick items there — progress shows up
              here automatically.
            </p>
          </div>
          <Link
            href={route}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-700"
          >
            {label}
            <ArrowRight />
          </Link>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Resources -------------------------------- */

function ResourceList({
  resources,
}: {
  resources: { label: string; href: string }[];
}) {
  return (
    <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Helpful links
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {resources.map((r) => (
          <li key={r.href}>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink />
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------- Save badge --------------------------- */

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "idle") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-brand-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        Synced
      </span>
    );
  }
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-brand-100">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-medium text-emerald-100">
        <CheckMini /> Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-2.5 py-1 text-xs font-medium text-red-100">
      ! Error
    </span>
  );
}

/* --------------------------------- Icons --------------------------------- */

function StepIconBadge({
  icon,
  status,
  number,
}: {
  icon: StepIcon;
  status: StepStatus;
  number: number;
}) {
  const wrap =
    status === "complete"
      ? "bg-emerald-500 text-white"
      : status === "current"
        ? "bg-brand-600 text-white"
        : status === "in-progress"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300";
  return (
    <span
      className={`relative flex h-11 w-11 flex-none items-center justify-center rounded-xl ${wrap}`}
    >
      {iconFor(icon)}
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 shadow ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700">
        {number}
      </span>
    </span>
  );
}

function iconFor(name: StepIcon) {
  const cls = "h-5 w-5";
  switch (name) {
    case "campus":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 10l10-5 10 5-10 5L2 10z" />
          <path d="M6 12v5c0 1 3 2 6 2s6-1 6-2v-5" />
        </svg>
      );
    case "appointment":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h2v2H8z" />
        </svg>
      );
    case "documents":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      );
    case "interview":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21l3-3h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16z" />
          <circle cx="12" cy="10" r="2" />
          <path d="M8 16c.5-2 2-3 4-3s3.5 1 4 3" />
        </svg>
      );
    case "tracking":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "travel":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      );
  }
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-200 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function CheckMini() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockMini() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
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

function ExternalLink() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
