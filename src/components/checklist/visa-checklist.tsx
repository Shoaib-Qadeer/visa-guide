"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  VISA_CHECKLIST,
  visibleIdsFor,
  totalItemsFor,
  type ChecklistCategory,
  type ChecklistItem,
  type FundingType,
} from "@/lib/visa-checklist";
import { saveChecklistProgress } from "@/lib/actions/progress";

type Filter = "all" | "todo" | "done";

type Props = {
  initialFunding: FundingType;
  initialChecked: string[];
};

export function VisaChecklist({ initialFunding, initialChecked }: Props) {
  const [funding, setFunding] = useState<FundingType>(initialFunding);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(initialChecked)
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [, startTransition] = useTransition();

  const visibleIds = useMemo(() => visibleIdsFor(funding), [funding]);
  const totalItems = useMemo(() => totalItemsFor(funding), [funding]);
  const visibleChecked = useMemo(
    () => Array.from(checked).filter((id) => visibleIds.has(id)),
    [checked, visibleIds]
  );
  const completed = visibleChecked.length;
  const percent = totalItems === 0 ? 0 : Math.round((completed / totalItems) * 100);

  // Debounced server save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await saveChecklistProgress({
          fundingType: funding,
          checkedItems: Array.from(checked),
        });
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
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funding, checked]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCollapse(catId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function checkAllInCategory(cat: ChecklistCategory, value: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const item of cat.items) {
        if (item.fundingOnly && item.fundingOnly !== funding) continue;
        if (value) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  }

  function reset() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset all ticked items? This cannot be undone.")
    )
      return;
    setChecked(new Set());
  }

  return (
    <div className="space-y-6">
      <Header
        funding={funding}
        setFunding={setFunding}
        completed={completed}
        total={totalItems}
        percent={percent}
        saveState={saveState}
        onReset={reset}
      />

      <Toolbar filter={filter} setFilter={setFilter} />

      <div className="space-y-4">
        {VISA_CHECKLIST.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            funding={funding}
            checked={checked}
            filter={filter}
            collapsed={collapsed.has(cat.id)}
            onToggleCollapse={() => toggleCollapse(cat.id)}
            onToggleItem={toggle}
            onCheckAll={(v) => checkAllInCategory(cat, v)}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}

/* ------------------------- Header / progress ------------------------- */

function Header({
  funding,
  setFunding,
  completed,
  total,
  percent,
  saveState,
  onReset,
}: {
  funding: FundingType;
  setFunding: (f: FundingType) => void;
  completed: number;
  total: number;
  percent: number;
  saveState: "idle" | "saving" | "saved" | "error";
  onReset: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-100/80">
              France · Student Visa
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Document Checklist
            </h1>
            <p className="mt-1 max-w-xl text-sm text-brand-100/90">
              Tick items as you collect them. Your progress saves automatically
              to your account.
            </p>
          </div>
          <SaveBadge state={saveState} />
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-brand-100/80">Overall progress</p>
            <p className="text-sm font-semibold tabular-nums">
              {completed} / {total}{" "}
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

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Funding type
          </p>
          <div className="inline-flex w-full max-w-sm rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <FundingPill
              active={funding === "undecided"}
              onClick={() => setFunding("undecided")}
              label="Undecided"
            />
            <FundingPill
              active={funding === "scholarship"}
              onClick={() => setFunding("scholarship")}
              label="Scholarship"
            />
            <FundingPill
              active={funding === "self_funded"}
              onClick={() => setFunding("self_funded")}
              label="Self-funded"
            />
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:self-end"
        >
          <ResetIcon />
          Reset progress
        </button>
      </div>

      <Notice />
    </section>
  );
}

function FundingPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
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
        <CheckTinyIcon /> Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-2.5 py-1 text-xs font-medium text-red-100">
      ! Error
    </span>
  );
}

function Notice() {
  return (
    <div className="border-t border-slate-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-900 dark:border-slate-800 dark:bg-amber-500/5 dark:text-amber-200 sm:px-5">
      <span className="font-semibold">Heads up:</span> everything marked{" "}
      <Tag tone="copy">copy</Tag> is a photocopy. Items marked{" "}
      <Tag tone="original">original</Tag> must be submitted as originals. The
      embassy does not return any submitted documents — never submit an original
      unless explicitly required.
    </div>
  );
}

/* ------------------------------ Toolbar ------------------------------ */

function Toolbar({
  filter,
  setFilter,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterTab>
        <FilterTab active={filter === "todo"} onClick={() => setFilter("todo")}>
          To do
        </FilterTab>
        <FilterTab active={filter === "done"} onClick={() => setFilter("done")}>
          Done
        </FilterTab>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Tip: use the arrow on each section to collapse it.
      </p>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

/* ----------------------------- Categories ---------------------------- */

function CategoryCard({
  category,
  funding,
  checked,
  filter,
  collapsed,
  onToggleCollapse,
  onToggleItem,
  onCheckAll,
}: {
  category: ChecklistCategory;
  funding: FundingType;
  checked: Set<string>;
  filter: Filter;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleItem: (id: string) => void;
  onCheckAll: (value: boolean) => void;
}) {
  const visibleItems = category.items.filter((i) => {
    if (i.fundingOnly && funding === "undecided") return false;
    if (i.fundingOnly && i.fundingOnly !== funding) return false;
    if (filter === "todo") return !checked.has(i.id);
    if (filter === "done") return checked.has(i.id);
    return true;
  });

  const totalForCat = category.items.filter(
    (i) => !i.fundingOnly || i.fundingOnly === funding
  ).length;
  const doneForCat = category.items.filter(
    (i) => (!i.fundingOnly || i.fundingOnly === funding) && checked.has(i.id)
  ).length;
  const allDone = totalForCat > 0 && doneForCat === totalForCat;

  if (visibleItems.length === 0 && filter !== "all") return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-start gap-3 px-5 py-4 sm:gap-4">
        <CategoryIcon name={category.icon} done={allDone} />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {category.title}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {doneForCat}/{totalForCat}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {category.description}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCheckAll(!allDone)}
            className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:inline-flex"
          >
            {allDone ? "Uncheck all" : "Check all"}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand" : "Collapse"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronIcon className={collapsed ? "" : "rotate-180"} />
          </button>
        </div>
      </header>

      {!collapsed && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {visibleItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              checked={checked.has(item.id)}
              onToggle={() => onToggleItem(item.id)}
            />
          ))}
          {visibleItems.length === 0 && (
            <li className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
              No items in this view.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------- Item -------------------------------- */

function ItemRow({
  item,
  checked,
  onToggle,
}: {
  item: ChecklistItem;
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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium ${
                checked
                  ? "text-slate-400 line-through dark:text-slate-500"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {item.title}
            </span>
            {item.quantity ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                ×{item.quantity}
              </span>
            ) : null}
            <Tag tone={item.kind}>
              {item.kind === "copy"
                ? "copy"
                : item.kind === "original"
                  ? "original"
                  : item.kind === "extra"
                    ? "extra"
                    : "cash"}
            </Tag>
          </div>
          {item.note ? (
            <p
              className={`mt-1 text-xs ${
                checked
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {item.note}
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

/* -------------------------------- Tags -------------------------------- */

function Tag({
  tone,
  children,
}: {
  tone: ItemTone;
  children: React.ReactNode;
}) {
  const tones: Record<ItemTone, string> = {
    copy:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    original:
      "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
    extra:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    cash:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
type ItemTone = "copy" | "original" | "extra" | "cash";

/* ------------------------------- Footer ------------------------------- */

function Footer() {
  return (
    <p className="text-center text-xs text-slate-400 dark:text-slate-500">
      Your ticked items are saved to your Supabase account — they&apos;ll be
      here when you sign in from another device.
    </p>
  );
}

/* ------------------------------- Icons -------------------------------- */

function CategoryIcon({
  name,
  done,
}: {
  name: ChecklistCategory["icon"];
  done: boolean;
}) {
  const wrap = `flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
    done
      ? "bg-emerald-500 text-white"
      : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
  }`;
  return <span className={wrap}>{iconFor(name)}</span>;
}

function iconFor(name: ChecklistCategory["icon"]) {
  const cls = "h-5 w-5";
  switch (name) {
    case "forms":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case "id":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="12" r="2.5" />
          <path d="M14 10h5M14 14h5" />
        </svg>
      );
    case "personal":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      );
    case "university":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 10l10-5 10 5-10 5L2 10z" />
          <path d="M6 12v5c0 1 3 2 6 2s6-1 6-2v-5" />
        </svg>
      );
    case "academic":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "money":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 10v4M18 10v4" />
        </svg>
      );
    case "house":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H10v7H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "extras":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M2 12h20" />
        </svg>
      );
    case "cash":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
  }
}

function ChevronIcon({ className = "" }: { className?: string }) {
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

function ResetIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function CheckTinyIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
