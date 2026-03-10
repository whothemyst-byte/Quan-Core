import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RecentSwarms() {
  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-white">Recent Swarms</h3>
      <div className="space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
          <span>Draft GTM plan for AI SaaS</span>
          <div className="flex items-center gap-3">
            <Badge>COMPLETED</Badge>
            <Link href="/swarm/demo" className="text-blue-400">View</Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

