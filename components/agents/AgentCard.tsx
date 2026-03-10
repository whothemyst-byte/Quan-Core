import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function AgentCard({
  name,
  role,
  builtIn,
}: {
  name: string;
  role: string;
  builtIn?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-xs text-slate-400">{role}</p>
        </div>
        {builtIn ? <Badge>Built-in</Badge> : null}
      </div>
      {builtIn ? <p className="mt-3 text-xs text-slate-500">Always active</p> : null}
    </Card>
  );
}

