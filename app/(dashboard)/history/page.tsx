import { ensureProvisionedUser } from "@/lib/user/provision";
import { listSwarmRunsForUser } from "@/lib/data/app";
import { HistoryWorkspace } from "@/components/history/HistoryWorkspace";
import { requireCurrentUser } from "@/lib/auth/server";

export default async function HistoryPage() {
  const user = await requireCurrentUser({ redirectTo: "/login?redirectTo=/history" });
  const appUser = await ensureProvisionedUser(user);
  const runs = await listSwarmRunsForUser(appUser.id, 40);
  return <HistoryWorkspace runs={runs} />;
}

