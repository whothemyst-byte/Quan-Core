import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function QuickStart() {
  return (
    <Card>
      <h3 className="mb-2 text-lg font-semibold text-white">Quick Start</h3>
      <p className="mb-4 text-sm text-slate-400">Launch a new swarm and monitor agent collaboration in real time.</p>
      <Link href="/dashboard">
        <Button>New Swarm</Button>
      </Link>
    </Card>
  );
}

