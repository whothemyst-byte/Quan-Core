import { ensureProvisionedUser } from "@/lib/user/provision";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSwarmRunsForUser } from "@/lib/data/app";
import { HistoryWorkspace } from "@/components/history/HistoryWorkspace";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const appUser = await ensureProvisionedUser(user);
  const runs = await listSwarmRunsForUser(appUser.id, 40);
  return <HistoryWorkspace runs={runs} />;
}

