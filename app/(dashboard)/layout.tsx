import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen qc-bg" style={{ color: "var(--qc-text)" }}>
      <DashboardSidebar />
      <section className="min-h-screen pl-72">
        <div className="mx-auto max-w-[1600px] px-8 py-6">{children}</div>
      </section>
    </div>
  );
}

