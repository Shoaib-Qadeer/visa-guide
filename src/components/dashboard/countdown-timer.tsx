"use client";

import { useEffect, useState } from "react";

type Props = {
  /** ISO string of the expiry date — passed from server to avoid hydration drift. */
  expiresAtISO: string;
};

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
};

function computeRemaining(target: number): Remaining {
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, totalMs: diff, expired: false };
}

export function CountdownTimer({ expiresAtISO }: Props) {
  const target = new Date(expiresAtISO).getTime();
  // Start with zeros to avoid SSR/CSR mismatch; hydrate on mount.
  const [r, setR] = useState<Remaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    expired: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setR(computeRemaining(target));
    const id = setInterval(() => setR(computeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const expiryLabel = new Date(expiresAtISO).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (r.expired && mounted) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-red-700">Access expired</h3>
        <p className="mt-1 text-sm text-red-600">
          Your access ended on {expiryLabel}.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-200">
            Access expires in
          </p>
          <p className="mt-1 text-sm text-brand-100/90">{expiryLabel}</p>
        </div>
        <PulseDot />
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3 text-center">
        <Cell value={mounted ? r.days : 0} label="Days" />
        <Cell value={mounted ? r.hours : 0} label="Hours" />
        <Cell value={mounted ? r.minutes : 0} label="Minutes" />
        <Cell value={mounted ? r.seconds : 0} label="Seconds" pulse />
      </div>
    </div>
  );
}

function Cell({
  value,
  label,
  pulse = false,
}: {
  value: number;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-4 backdrop-blur ring-1 ring-white/10">
      <div
        className={`tabular-nums text-3xl font-semibold sm:text-4xl ${
          pulse ? "transition-opacity duration-500" : ""
        }`}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-brand-100/80">
        {label}
      </div>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}
