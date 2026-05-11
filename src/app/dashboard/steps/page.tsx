import { createClient } from "@/lib/supabase/server";
import { VisaStepsTracker } from "@/components/steps/visa-steps-tracker";
import {
  visibleIdsFor,
  type FundingType,
} from "@/lib/visa-checklist";

export const metadata = { title: "Visa Steps · Visa Guide" };

type ProgressRow = {
  funding_type: FundingType | null;
  checked_items: string[] | null;
  step_tasks: string[] | null;
};

export default async function StepsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let funding: FundingType = "undecided";
  let checkedDocs: string[] = [];
  let stepTasks: string[] = [];

  if (user) {
    const { data } = await supabase
      .from("checklist_progress")
      .select("funding_type, checked_items, step_tasks")
      .eq("user_id", user.id)
      .maybeSingle<ProgressRow>();

    if (data) {
      funding = (data.funding_type ?? "undecided") as FundingType;
      checkedDocs = Array.isArray(data.checked_items) ? data.checked_items : [];
      stepTasks = Array.isArray(data.step_tasks) ? data.step_tasks : [];
    }
  }

  const visibleDocIds = visibleIdsFor(funding);
  const docDone = checkedDocs.filter((id) => visibleDocIds.has(id)).length;
  const docTotal = visibleDocIds.size;

  return (
    <div className="mx-auto max-w-4xl">
      <VisaStepsTracker
        initialStepTasks={stepTasks}
        documentsProgress={{ done: docDone, total: docTotal }}
      />
    </div>
  );
}
