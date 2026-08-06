import { cn } from "@/lib/utils";

const PanelShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section
    className={cn(
      "flex w-[320px] shrink-0 flex-col border-l border-t border-border bg-card text-muted-foreground sticky left-14 h-full max-sm:hidden select-none overflow-y-auto pb-20",
      className
    )}
  >
    {children}
  </section>
);

export default PanelShell;
