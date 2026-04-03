import { redirect } from "next/navigation";
import { PromptWorkspace } from "@/components/prompts/PromptWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PromptsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/prompts");
  }

  return <PromptWorkspace />;
}
