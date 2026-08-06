"use client";

import { memo, useState } from "react";

import { navElements } from "@/constants";
import { ActiveElement, NavbarProps } from "@/types/type";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "./ui/button";
import ShapesMenu from "./ShapesMenu";
import ActiveUsers from "./users/ActiveUsers";
import { NewThread } from "./comments/NewThread";
import EditableProjectName from "./EditableProjectName";

const Navbar = ({
  activeElement,
  imageInputRef,
  handleImageUpload,
  handleActiveElement,
  projectId,
  initialName,
}: NavbarProps) => {
  // "Clear canvas" is destructive and irreversible (it wipes every shape,
  // for every collaborator in the room) — it gets a confirmation instead of
  // firing straight from the toolbar click like every other tool.
  const [pendingClear, setPendingClear] = useState<ActiveElement | null>(null);

  const isActive = (value: string | Array<ActiveElement>) =>
    (activeElement && activeElement.value === value) ||
    (Array.isArray(value) && value.some((val) => val?.value === activeElement?.value));

  const handleItemClick = (item: any) => {
    if (Array.isArray(item.value)) return;
    if (item.value === "reset") {
      setPendingClear(item);
      return;
    }
    handleActiveElement(item);
  };

  return (
    <nav className="flex select-none items-center justify-between gap-4 border-b border-border bg-card px-5 text-foreground">
      <Breadcrumb
        items={[{ label: "Modelier", href: "/" }]}
        trailing={
          projectId && initialName !== undefined ? (
            <EditableProjectName patchUrl={`/api/projects/${projectId}`} initialName={initialName} />
          ) : undefined
        }
      />

      <ul className="flex flex-row">
        {navElements.map((item: ActiveElement | any) => (
          <li
            key={item.name}
            onClick={() => handleItemClick(item)}
            className={`group px-2.5 py-5 flex justify-center items-center border-b-2
            ${isActive(item.value) ? "border-accent bg-accent/10" : "border-transparent hover:bg-muted"}
            `}
          >
            {/* If value is an array means it's a nav element with sub options i.e., dropdown */}
            {Array.isArray(item.value) ? (
              <ShapesMenu
                item={item}
                activeElement={activeElement}
                imageInputRef={imageInputRef}
                handleActiveElement={handleActiveElement}
                handleImageUpload={handleImageUpload}
              />
            ) : item?.value === "comments" ? (
              // If value is comments, trigger the NewThread component
              <NewThread>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-transparent" aria-label={item.name}>
                  <item.icon className="h-5 w-5" />
                </Button>
              </NewThread>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-transparent" aria-label={item.name}>
                <item.icon className="h-5 w-5" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <ActiveUsers />

      <AlertDialog open={pendingClear !== null} onOpenChange={(open) => !open && setPendingClear(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every shape, text, and image on the canvas for everyone in this project. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingClear(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingClear) handleActiveElement(pendingClear);
                setPendingClear(null);
              }}
            >
              Clear canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};

export default memo(Navbar, (prevProps, nextProps) => prevProps.activeElement === nextProps.activeElement);
