/**
 * Visa journey for a student who already has admission to a French university.
 * 6 sequential steps, each with sub-tasks the user can tick off.
 *
 * IMPORTANT: `id` strings are stable persistence keys (saved to Supabase).
 * Never rename them — only add new ones.
 */

export type StepTask = {
  id: string;
  title: string;
  hint?: string;
};

export type StepResource = {
  label: string;
  href: string;
};

export type StepIcon =
  | "campus"
  | "appointment"
  | "documents"
  | "interview"
  | "tracking"
  | "travel";

export type VisaStep = {
  id: string;
  number: number;
  title: string;
  summary: string;
  duration: string;
  icon: StepIcon;
  tasks: StepTask[];
  resources?: StepResource[];
  /** When set, this step delegates its progress to another tracker. */
  linked?: { route: string; label: string; kind: "documents" };
};

export const VISA_STEPS: VisaStep[] = [
  {
    id: "campus-france",
    number: 1,
    title: "Campus France (EEF)",
    summary:
      "Most students applying from outside the EU need to clear Campus France's Études en France (EEF) procedure before booking a visa appointment.",
    duration: "2–4 weeks",
    icon: "campus",
    tasks: [
      {
        id: "step.eef.account",
        title: "Created my Études en France account",
        hint: "pastel.diplomatie.gouv.fr → register with your details.",
      },
      {
        id: "step.eef.dossier",
        title: "Submitted my EEF dossier (CV, statement, transcripts)",
      },
      {
        id: "step.eef.fee",
        title: "Paid the Campus France fee",
      },
      {
        id: "step.eef.interview",
        title: "Attended my Campus France interview",
        hint: "Be confident, know your project — they'll ask why France, why this university.",
      },
      {
        id: "step.eef.acceptance",
        title: "Received my EEF acceptance / NOC letter",
        hint: "This is mandatory for the visa appointment.",
      },
    ],
    resources: [
      { label: "Études en France portal", href: "https://pastel.diplomatie.gouv.fr/etudesenfrance/" },
      { label: "Campus France official site", href: "https://www.campusfrance.org/" },
    ],
  },
  {
    id: "appointment",
    number: 2,
    title: "Book Visa Appointment (AEG)",
    summary:
      "Once you have your EEF clearance, fill the France-Visas online form and book a visa appointment at your local VFS / TLScontact.",
    duration: "1–3 weeks (slots fill fast)",
    icon: "appointment",
    tasks: [
      {
        id: "step.app.france-visas",
        title: "Filled the visa application form on France-Visas",
        hint: "france-visas.gouv.fr → start application → long-stay (>90 days) → studies.",
      },
      {
        id: "step.app.center-account",
        title: "Created my VFS Global / TLScontact account",
        hint: "Which one depends on your country — France-Visas tells you at the end.",
      },
      {
        id: "step.app.slot",
        title: "Booked an appointment slot",
        hint: "Pick the earliest available slot. You can usually reschedule once.",
      },
      {
        id: "step.app.aeg-slip",
        title: "Downloaded and printed my AEG appointment slip",
        hint: "Print 2–3 copies. Note the exact visa fee printed on it.",
      },
    ],
    resources: [
      { label: "France-Visas (start here)", href: "https://france-visas.gouv.fr/" },
      { label: "VFS Global", href: "https://www.vfsglobal.com/" },
      { label: "TLScontact", href: "https://fr.tlscontact.com/" },
    ],
  },
  {
    id: "documents",
    number: 3,
    title: "Prepare Documents",
    summary:
      "Assemble every document on the embassy checklist — exact copies, in the right order, with photos glued to the forms.",
    duration: "3–7 days",
    icon: "documents",
    tasks: [],
    linked: {
      route: "/dashboard/documents",
      label: "Open document checklist",
      kind: "documents",
    },
  },
  {
    id: "appointment-day",
    number: 4,
    title: "Attend the Visa Appointment",
    summary:
      "Show up early with your full file, the exact cash fee, and your original passport. Biometrics (fingerprints + photo) are taken on the day.",
    duration: "1 day · ~2 hours on site",
    icon: "interview",
    tasks: [
      {
        id: "step.day.confirmed",
        title: "Confirmed appointment date, time, and venue",
      },
      {
        id: "step.day.passport",
        title: "Carried my original passport",
      },
      {
        id: "step.day.file",
        title: "Carried the complete document file (forms first, then originals/copies)",
      },
      {
        id: "step.day.fee",
        title: "Carried the exact visa fee in cash",
        hint: "Amount is printed on your AEG slip. Most centers don't accept cards.",
      },
      {
        id: "step.day.biometrics",
        title: "Provided biometrics (fingerprints + photo)",
      },
      {
        id: "step.day.receipt",
        title: "Got my submission receipt with the application reference number",
      },
    ],
  },
  {
    id: "tracking",
    number: 5,
    title: "Track & Wait for Decision",
    summary:
      "Most student visa decisions for France come back in 2–4 weeks. You can track the status online with the reference number on your receipt.",
    duration: "2–4 weeks",
    icon: "tracking",
    tasks: [
      {
        id: "step.track.reference",
        title: "Saved my application reference number somewhere safe",
      },
      {
        id: "step.track.portal",
        title: "Tracking my application on the VFS / TLScontact portal",
      },
      {
        id: "step.track.decision",
        title: "Received the decision notification (passport ready for pickup)",
      },
    ],
    resources: [
      { label: "VFS – track application", href: "https://www.vfsglobal.com/" },
      { label: "TLScontact – track application", href: "https://fr.tlscontact.com/" },
    ],
  },
  {
    id: "travel",
    number: 6,
    title: "Collect Visa & Plan Travel",
    summary:
      "Pick up your passport, double-check the visa sticker, then sort out your flight, accommodation, and arrival folder.",
    duration: "1–2 weeks before flying",
    icon: "travel",
    tasks: [
      {
        id: "step.travel.collected",
        title: "Collected my passport with the visa sticker",
      },
      {
        id: "step.travel.verify",
        title: "Verified visa details — dates, type (D), and entries",
        hint: "Mistakes happen. Check before you leave the center.",
      },
      {
        id: "step.travel.flight",
        title: "Booked my flight to France",
      },
      {
        id: "step.travel.accommodation",
        title: "Confirmed accommodation for arrival (CROUS / hotel / Airbnb)",
      },
      {
        id: "step.travel.arrival-pack",
        title: "Prepared an arrival folder (visa, admission, accommodation, OFII form)",
        hint: "Carry these in your hand baggage — border officers may ask.",
      },
      {
        id: "step.travel.notify",
        title: "Notified my university of my arrival date",
      },
    ],
    resources: [
      { label: "OFII (validate visa after arrival)", href: "https://administration-etrangers-en-france.interieur.gouv.fr/" },
    ],
  },
];

/** Total step task ids (excluding linked steps which have 0 tasks). */
export function totalStepTaskCount(): number {
  return VISA_STEPS.reduce((acc, s) => acc + s.tasks.length, 0);
}

/** Returns the set of all step-task ids (stable ids, dedup). */
export function allStepTaskIds(): Set<string> {
  const set = new Set<string>();
  for (const step of VISA_STEPS) for (const t of step.tasks) set.add(t.id);
  return set;
}

export type StepCompletion = {
  step: VisaStep;
  done: number;
  total: number;
  isComplete: boolean;
};

/**
 * Compute completion per step. For a `linked` step, pass externalProgress
 * — the documents step uses { done: checkedDocs, total: totalVisibleDocs }.
 */
export function computeStepCompletions(args: {
  doneStepTaskIds: Set<string>;
  linkedDocumentsProgress: { done: number; total: number };
}): StepCompletion[] {
  const { doneStepTaskIds, linkedDocumentsProgress } = args;
  return VISA_STEPS.map((step) => {
    if (step.linked && step.linked.kind === "documents") {
      const { done, total } = linkedDocumentsProgress;
      return {
        step,
        done,
        total,
        isComplete: total > 0 && done === total,
      };
    }
    const total = step.tasks.length;
    const done = step.tasks.filter((t) => doneStepTaskIds.has(t.id)).length;
    return { step, done, total, isComplete: total > 0 && done === total };
  });
}

/** Find the first not-yet-complete step. Returns the last step if all done. */
export function currentStep(completions: StepCompletion[]): StepCompletion {
  for (const c of completions) if (!c.isComplete) return c;
  return completions[completions.length - 1];
}
