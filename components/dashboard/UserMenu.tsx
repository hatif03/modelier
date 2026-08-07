"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { colorForName, initialsForName } from "@/lib/avatarColor";

// Scoped to exactly what the User model has today (id, email, name?,
// createdAt) — no avatar photo, plan/tier, or settings page exist yet, so
// this doesn't invent destinations for them.
const UserMenu = () => {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  const displayName = user.name ?? user.email?.split("@")[0] ?? "Account";
  const swatch = colorForName(displayName);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-sm text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: swatch }}
        >
          {initialsForName(displayName)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass-card flex w-64 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-base text-white"
            style={{ backgroundColor: swatch }}
          >
            {initialsForName(displayName)}
          </span>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>

        <Separator />

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default UserMenu;
