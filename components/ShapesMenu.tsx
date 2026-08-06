"use client";

import { ShapesMenuProps } from "@/types/type";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const ShapesMenu = ({
  item,
  activeElement,
  handleActiveElement,
  handleImageUpload,
  imageInputRef,
}: ShapesMenuProps) => {
  const isDropdownElem = item.value.some((elem) => elem?.value === activeElement.value);
  const TriggerIcon = isDropdownElem ? activeElement.icon : item.icon;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="no-ring">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-transparent"
            aria-label={item.name}
            onClick={() => handleActiveElement(item)}
          >
            {TriggerIcon && <TriggerIcon className="h-5 w-5" />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="mt-5 flex flex-col gap-y-1 border border-border bg-card py-4 text-foreground">
          {item.value.map((elem) => {
            const ElemIcon = elem?.icon;
            return (
              <Button
                key={elem?.name}
                variant="ghost"
                onClick={() => {
                  handleActiveElement(elem);
                }}
                className={`flex h-fit justify-between gap-10 rounded-none border-l-2 px-5 py-3 focus:border-none ${
                  activeElement.value === elem?.value
                    ? "border-l-accent bg-accent/10 font-semibold hover:bg-accent/10"
                    : "border-l-transparent hover:bg-muted"
                }`}
              >
                <div className="group flex items-center gap-2">
                  {ElemIcon && <ElemIcon className="h-4 w-4" />}
                  <p className="text-sm text-foreground">{elem?.name}</p>
                </div>
              </Button>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        className="hidden"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
      />
    </>
  );
};

export default ShapesMenu;
