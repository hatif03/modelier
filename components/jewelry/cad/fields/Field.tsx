"use client";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
    {children}
  </div>
);

export default Field;
