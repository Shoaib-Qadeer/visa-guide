/**
 * Source of truth for the French Embassy student visa document checklist.
 *
 * IMPORTANT: `id` strings are stable persistence keys — never rename them
 * once users are saving progress in production. Add new ids; don't reuse old ones.
 */

export type FundingType = "undecided" | "scholarship" | "self_funded";

export type ItemKind = "copy" | "original" | "extra" | "cash";

export type ChecklistItem = {
  id: string;
  title: string;
  /** Number of physical copies / instances. */
  quantity?: number;
  /** Drives the colored badge on the right. */
  kind: ItemKind;
  /** Optional helper text shown beneath the title. */
  note?: string;
  /** When set, the item is only shown for users with this funding type. */
  fundingOnly?: Exclude<FundingType, "undecided">;
};

export type ChecklistCategory = {
  id: string;
  title: string;
  description: string;
  /** Lucide-ish icon name; rendered by the UI's icon switch. */
  icon:
    | "forms"
    | "id"
    | "personal"
    | "university"
    | "academic"
    | "money"
    | "house"
    | "extras"
    | "cash";
  items: ChecklistItem[];
};

export const VISA_CHECKLIST: ChecklistCategory[] = [
  {
    id: "forms",
    title: "Visa Application Forms",
    description: "Fill these out neatly. Glue the photo on top-right of each form.",
    icon: "forms",
    items: [
      {
        id: "form-completed",
        title: "Completed Schengen visa application forms",
        quantity: 2,
        kind: "copy",
        note: "Each form must have a Schengen-sized photo glued to it.",
      },
      {
        id: "form-photo-spare",
        title: "Additional Schengen-sized photo",
        quantity: 1,
        kind: "copy",
        note: "Unattached — keep it loose with your file.",
      },
    ],
  },
  {
    id: "identity",
    title: "Identity Documents",
    description: "Photocopies only — the embassy will not return submitted documents.",
    icon: "id",
    items: [
      {
        id: "passport",
        title: "Passport information page",
        quantity: 1,
        kind: "copy",
        note: "Plus copies of any existing visas you have.",
      },
      {
        id: "national-id",
        title: "National ID card (CNIC)",
        quantity: 1,
        kind: "copy",
        note: "Printed on A4 — both sides.",
      },
      {
        id: "birth-certificate",
        title: "Birth certificate",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "parent-id",
        title: "Father's or mother's national ID card",
        quantity: 1,
        kind: "copy",
        note: "Printed on A4 — both sides.",
      },
    ],
  },
  {
    id: "personal",
    title: "Personal Statement",
    description: "Your story in your own words — make it crisp and honest.",
    icon: "personal",
    items: [
      {
        id: "cv",
        title: "Curriculum Vitae (CV)",
        quantity: 2,
        kind: "copy",
      },
      {
        id: "cover-letter",
        title: "Cover letter",
        quantity: 1,
        kind: "copy",
        note: "Address it to the consular officer; explain your study plan.",
      },
    ],
  },
  {
    id: "university",
    title: "University & Application",
    description: "Documents that prove your admission and the official process.",
    icon: "university",
    items: [
      {
        id: "eef-letter",
        title: "EEF admission letter",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "uni-letter",
        title: "University admission letter",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "eef-receipt",
        title: "EEF payment receipt",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "aeg-slip",
        title: "AEG appointment slip",
        quantity: 1,
        kind: "copy",
        note: "Bring 1–2 extra printouts in your extras folder.",
      },
    ],
  },
  {
    id: "academic",
    title: "Academic Records",
    description: "All degrees, transcripts, and supporting academic proof.",
    icon: "academic",
    items: [
      {
        id: "uni-degree",
        title: "University degree and transcripts",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "fsc-matric",
        title: "FSc and Matric degrees & marksheets",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "internship",
        title: "Internship letter",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "recommendations",
        title: "Recommendation letters from professors",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "ielts-epl",
        title: "IELTS certificate or EPL",
        quantity: 1,
        kind: "copy",
      },
    ],
  },
  {
    id: "funding",
    title: "Financial Proof",
    description:
      "Pick your funding type above to filter — items are conditional.",
    icon: "money",
    items: [
      {
        id: "scholarship-letter",
        title: "Scholarship letter",
        quantity: 1,
        kind: "copy",
        fundingOnly: "scholarship",
      },
      {
        id: "affidavit-of-support",
        title: "Affidavit of support",
        kind: "original",
        note: "Submit as ORIGINAL — not a photocopy.",
        fundingOnly: "self_funded",
      },
      {
        id: "bank-statement",
        title: "Bank statement",
        kind: "original",
        note: "Submit as ORIGINAL — not a photocopy.",
        fundingOnly: "self_funded",
      },
      {
        id: "tax-returns",
        title: "Tax returns",
        quantity: 1,
        kind: "copy",
        fundingOnly: "self_funded",
      },
    ],
  },
  {
    id: "accommodation",
    title: "Accommodation",
    description: "Proof of where you'll stay when you arrive in France.",
    icon: "house",
    items: [
      {
        id: "booking-confirmation",
        title: "Booking.com accommodation confirmation",
        quantity: 1,
        kind: "copy",
      },
      {
        id: "accommodation-letter",
        title: "Accommodation explanation letter",
        quantity: 1,
        kind: "copy",
        note: "Explain your CROUS situation and why you're using a hotel/Airbnb.",
      },
    ],
  },
  {
    id: "extras",
    title: "Extras to Bring (just in case)",
    description: "Spares for anything that might go wrong on appointment day.",
    icon: "extras",
    items: [
      {
        id: "extra-forms",
        title: "Extra blank Schengen visa forms",
        quantity: 2,
        kind: "extra",
      },
      {
        id: "extra-photos",
        title: "Extra Schengen-sized photos",
        kind: "extra",
      },
      {
        id: "extra-id-copies",
        title: "Extra passport and/or ID card copies",
        kind: "extra",
      },
      {
        id: "extra-aeg",
        title: "Extra AEG appointment slip printouts",
        quantity: 2,
        kind: "extra",
      },
    ],
  },
  {
    id: "cash",
    title: "Cash to Bring",
    description: "The embassy accepts the visa fee in cash only.",
    icon: "cash",
    items: [
      {
        id: "cash-fee",
        title: "Exact visa processing fee in cash",
        kind: "cash",
        note: "Exact amount is printed on your AEG appointment slip.",
      },
      {
        id: "cash-extra",
        title: "Extra ~5,000 PKR for transport & misc.",
        kind: "cash",
        note: "Shuttle, food, photocopies, contingencies.",
      },
    ],
  },
];

/** Total item count for a given funding type. */
export function totalItemsFor(funding: FundingType): number {
  let count = 0;
  for (const cat of VISA_CHECKLIST) {
    for (const item of cat.items) {
      if (!item.fundingOnly) {
        count++;
        continue;
      }
      if (funding === "undecided") continue;
      if (item.fundingOnly === funding) count++;
    }
  }
  return count;
}

/** All item ids that are visible for a given funding type. */
export function visibleIdsFor(funding: FundingType): Set<string> {
  const set = new Set<string>();
  for (const cat of VISA_CHECKLIST) {
    for (const item of cat.items) {
      if (!item.fundingOnly) {
        set.add(item.id);
        continue;
      }
      if (funding === "undecided") continue;
      if (item.fundingOnly === funding) set.add(item.id);
    }
  }
  return set;
}
