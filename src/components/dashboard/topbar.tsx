"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type Props = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export function Topbar({ displayName, email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:px-8">
      <div className="lg:hidden">
        <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Visa Guide
        </span>
      </div>

      <div className="hidden lg:block">
        <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Welcome back,{" "}
          <span className="text-slate-900 dark:text-slate-100">{displayName}</span>
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden pr-1 text-slate-700 dark:text-slate-200 sm:inline">
              {displayName}
            </span>
          </button>

          {open ? (
            <div className="absolute right-0 mt-2 w-60 origin-top-right animate-fade-in rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {email}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogoutIcon />
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
