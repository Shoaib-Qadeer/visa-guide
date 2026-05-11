import { createClient } from "@/lib/supabase/server";
import { VisaChecklist } from "@/components/checklist/visa-checklist";
import type { FundingType } from "@/lib/visa-checklist";

export const metadata = { title: "Documents · Visa Guide" };

type ProgressRow = {
  funding_type: FundingType;
  checked_items: string[] | null;
};

export default async function DocumentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let funding: FundingType = "undecided";
  let checked: string[] = [];

  if (user) {
    const { data } = await supabase
      .from("checklist_progress")
      .select("funding_type, checked_items")
      .eq("user_id", user.id)
      .maybeSingle<ProgressRow>();

    if (data) {
      funding = (data.funding_type ?? "undecided") as FundingType;
      checked = Array.isArray(data.checked_items) ? data.checked_items : [];
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <VisaChecklist initialFunding={funding} initialChecked={checked} />
    </div>
  );
}
