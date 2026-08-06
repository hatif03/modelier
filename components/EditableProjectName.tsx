"use client";

import { useState } from "react";

type Props = {
  patchUrl: string;
  method?: "PATCH" | "PUT";
  initialName: string;
  className?: string;
};

const EditableProjectName = ({ patchUrl, method = "PATCH", initialName, className }: Props) => {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);

  const commit = async () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setDraft(name);
      return;
    }
    setName(trimmed);
    await fetch(patchUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    }).catch(() => {});
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setIsEditing(false);
          }
        }}
        className={className ?? "border-b border-accent bg-transparent text-sm text-foreground outline-none"}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      title="Rename"
      className={className ?? "text-sm text-foreground hover:text-accent"}
    >
      {name}
    </button>
  );
};

export default EditableProjectName;
