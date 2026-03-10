import { Card } from "@/components/ui/card";

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-slate-400">Total swarms run</p><p className="mt-2 text-2xl font-semibold text-white">0</p></Card>
      <Card><p className="text-sm text-slate-400">Tokens used</p><p className="mt-2 text-2xl font-semibold text-white">0</p></Card>
      <Card><p className="text-sm text-slate-400">Active agents</p><p className="mt-2 text-2xl font-semibold text-white">2</p></Card>
    </div>
  );
}

