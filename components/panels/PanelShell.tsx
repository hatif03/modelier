const PanelShell = ({ children }: { children: React.ReactNode }) => (
  <section className="flex flex-col border-t border-border bg-card text-muted-foreground min-w-[260px] sticky left-0 h-full max-sm:hidden select-none overflow-y-auto pb-20">
    {children}
  </section>
);

export default PanelShell;
