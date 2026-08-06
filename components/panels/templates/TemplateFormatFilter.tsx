"use client";

import { FORMATS } from "@/lib/formats";
import { PillGroup } from "@/components/ui/pill-button";

const OPTIONS = [{ id: "all", label: "All" }, ...FORMATS.map((f) => ({ id: f.id, label: f.label }))];

type Props = {
  active: string;
  onChange: (format: string) => void;
};

const TemplateFormatFilter = ({ active, onChange }: Props) => (
  <div className="px-5 py-3">
    <PillGroup options={OPTIONS} value={active} onChange={onChange} />
  </div>
);

export default TemplateFormatFilter;
