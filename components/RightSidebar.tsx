import React, { useMemo, useRef } from "react";
import { fabric } from "fabric";

import { RightSidebarProps } from "@/types/type";
import { modifyShape } from "@/lib/shapes";

import Text from "./settings/Text";
import Color from "./settings/Color";
import Export from "./settings/Export";
import Dimensions from "./settings/Dimensions";
import Opacity from "./settings/Opacity";
import Arrange from "./settings/Arrange";
import EmptyState from "./settings/EmptyState";
import MagicResize from "./settings/MagicResize";

const TEXT_TYPES = ["textbox", "i-text", "text"];
const IMAGE_TYPES = ["image"];

const RightSidebar = ({
  elementAttributes,
  setElementAttributes,
  fabricRef,
  activeObjectRef,
  isEditingRef,
  syncShapeInStorage,
  projectId,
  initialName,
}: RightSidebarProps) => {
  const colorInputRef = useRef(null);
  const strokeInputRef = useRef(null);

  const handleInputChange = (property: string, value: string) => {
    if (!isEditingRef.current) isEditingRef.current = true;

    setElementAttributes((prev) => ({ ...prev, [property]: value }));

    modifyShape({
      canvas: fabricRef.current as fabric.Canvas,
      property,
      value,
      activeObjectRef,
      syncShapeInStorage,
    });
  };

  const { type } = elementAttributes;
  const isText = type ? TEXT_TYPES.includes(type) : false;
  const isImage = type ? IMAGE_TYPES.includes(type) : false;

  // memoize the content of the right sidebar to avoid re-rendering on every mouse actions
  const memoizedContent = useMemo(
    () => (
      <section className="flex w-80 shrink-0 flex-col border-t border-border bg-card text-muted-foreground sticky right-0 h-full max-sm:hidden select-none overflow-y-auto shadow-panel">
        <h3 className="px-5 pt-4 font-serif text-base text-foreground">Design</h3>
        <span className="text-xs text-muted-foreground mt-3 px-5 border-b border-border pb-4">
          {type ? "Make changes to canvas as you like" : "Nothing selected"}
        </span>

        {type ? (
          <>
            <Dimensions
              isEditingRef={isEditingRef}
              width={elementAttributes.width}
              height={elementAttributes.height}
              handleInputChange={handleInputChange}
            />

            {isText && (
              <Text
                fontFamily={elementAttributes.fontFamily}
                fontSize={elementAttributes.fontSize}
                fontWeight={elementAttributes.fontWeight}
                handleInputChange={handleInputChange}
              />
            )}

            {!isImage && (
              <Color
                inputRef={colorInputRef}
                attribute={elementAttributes.fill}
                placeholder="Fill"
                attributeType="fill"
                handleInputChange={handleInputChange}
              />
            )}

            {!isText && !isImage && (
              <Color
                inputRef={strokeInputRef}
                attribute={elementAttributes.stroke}
                placeholder="Stroke"
                attributeType="stroke"
                handleInputChange={handleInputChange}
              />
            )}

            <Opacity opacity={elementAttributes.opacity} handleInputChange={handleInputChange} />

            <Arrange fabricRef={fabricRef} syncShapeInStorage={syncShapeInStorage} />
          </>
        ) : (
          <EmptyState />
        )}

        <MagicResize fabricRef={fabricRef} projectId={projectId} initialName={initialName} />
        <Export />
      </section>
    ),
    [elementAttributes, projectId, initialName]
  ); // re-render when elementAttributes changes, or (once, at mount) projectId/initialName

  return memoizedContent;
};

export default RightSidebar;
