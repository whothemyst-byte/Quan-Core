import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AgentOutputPanel({
  open,
  onOpenChange,
  title,
  output,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  output: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <pre className="max-h-[90vh] overflow-auto whitespace-pre-wrap text-sm text-slate-200">{output}</pre>
      </SheetContent>
    </Sheet>
  );
}

