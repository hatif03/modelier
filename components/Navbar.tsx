"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";

import { navElements } from "@/constants";
import { ActiveElement, NavbarProps } from "@/types/type";

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
  const isActive = (value: string | Array<ActiveElement>) =>
    (activeElement && activeElement.value === value) ||
    (Array.isArray(value) && value.some((val) => val?.value === activeElement?.value));

  return (
    <nav className="flex select-none items-center justify-between gap-4 border-b border-border bg-card px-5 text-foreground">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-serif text-lg tracking-tight hover:text-accent">
          Modelier
        </Link>
        {projectId && initialName !== undefined && (
          <>
            <span className="text-border">/</span>
            <EditableProjectName projectId={projectId} initialName={initialName} />
          </>
        )}
      </div>

      <ul className="flex flex-row">
        {navElements.map((item: ActiveElement | any) => (
          <li
            key={item.name}
            onClick={() => {
              if (Array.isArray(item.value)) return;
              handleActiveElement(item);
            }}
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
                <Button variant="ghost" className="relative h-5 w-5 object-contain p-0 hover:bg-transparent">
                  <Image src={item.icon} alt={item.name} fill className="invert" />
                </Button>
              </NewThread>
            ) : (
              <Button variant="ghost" className="relative h-5 w-5 object-contain p-0 hover:bg-transparent">
                <Image src={item.icon} alt={item.name} fill className="invert" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <ActiveUsers />
    </nav>
  );
};

export default memo(Navbar, (prevProps, nextProps) => prevProps.activeElement === nextProps.activeElement);
