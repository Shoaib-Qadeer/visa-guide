"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FundingType } from "@/lib/visa-checklist";

export type SaveResult = { ok: boolean; error?: string };

const VALID_FUNDING: FundingType[] = ["undecided", "scholarship", "self_funded"];

function cleanIds(input: string[] | undefined | null): string[] {
  return Array.from(
    new Set((input ?? []).filter((s) => typeof s === "string"))
  ).slice(0, 1000);
}

/** Save the document checklist (funding type + checked document item ids). */
export async function saveChecklistProgress(input: {
  fundingType: FundingType;
  checkedItems: string[];
}): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  if (!VALID_FUNDING.includes(input.fundingType)) {
    return { ok: false, error: "Invalid funding type" };
  }

  const cleaned = cleanIds(input.checkedItems);

  const { error } = await supabase.from("checklist_progress").upsert(
    {
      user_id: user.id,
      funding_type: input.fundingType,
      checked_items: cleaned,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Save the visa-step task progress (list of completed step task ids). */
export async function saveStepProgress(input: {
  stepTasks: string[];
}): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const cleaned = cleanIds(input.stepTasks);

  const { error } = await supabase.from("checklist_progress").upsert(
    {
      user_id: user.id,
      step_tasks: cleaned,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/steps");
  revalidatePath("/dashboard");
  return { ok: true };
}
