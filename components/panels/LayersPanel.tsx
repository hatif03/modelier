"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { Eye, EyeOff, GripVertical, Lock, Unlock } from "lucide-react";

import { getShapeInfo, cn } from "@/lib/utils";
import { CustomFabricObject } from "@/types/type";

type Props = {
  allShapes: Array<[string, any]>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const findFabricObject = (canvas: fabric.Canvas | null, objectId: string) =>
  canvas?.getObjects().find((o) => (o as CustomFabricObject<fabric.Object>).objectId === objectId) as
    | CustomFabricObject<fabric.Object>
    | undefined;

const LayersPanel = ({ allShapes, fabricRef, syncShapeInStorage }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  // Tracks the canvas's own current selection directly, rather than depending
  // on a re-render from the parent (allShapes is memoized by length there so
  // it doesn't fire on every mouse move — that would otherwise starve this
  // panel of selection updates too).
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const syncSelection = () => {
      const active = canvas.getActiveObject() as CustomFabricObject<fabric.Object> | undefined;
      setSelectedId(active?.objectId ?? null);
    };
    const clearSelection = () => setSelectedId(null);

    canvas.on("selection:created", syncSelection);
    canvas.on("selection:updated", syncSelection);
    canvas.on("selection:cleared", clearSelection);

    syncSelection();

    return () => {
      canvas.off("selection:created", syncSelection);
      canvas.off("selection:updated", syncSelection);
      canvas.off("selection:cleared", clearSelection);
    };
  }, [fabricRef]);

  const handleSelect = (objectId: string) => {
    const canvas = fabricRef.current;
    const object = findFabricObject(canvas, objectId);
    if (!canvas || !object || object.locked) return;
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    setSelectedId(objectId);
  };

  const toggleVisible = (objectId: string) => {
    const canvas = fabricRef.current;
    const object = findFabricObject(canvas, objectId);
    if (!object) return;
    object.set("visible", !object.visible);
    canvas?.requestRenderAll();
    syncShapeInStorage(object);
  };

  const toggleLocked = (objectId: string) => {
    const canvas = fabricRef.current;
    const object = findFabricObject(canvas, objectId);
    if (!object) return;
    const locked = !object.locked;
    object.locked = locked;
    object.set({
      lockMovementX: locked,
      lockMovementY: locked,
      selectable: !locked,
      evented: !locked,
    });
    if (locked && canvas?.getActiveObject() === object) {
      canvas.discardActiveObject();
      setSelectedId(null);
    }
    canvas?.requestRenderAll();
    syncShapeInStorage(object);
  };

  const commitRename = (objectId: string) => {
    const object = findFabricObject(fabricRef.current, objectId);
    const trimmed = renameDraft.trim();
    if (object && trimmed) {
      object.name = trimmed;
      syncShapeInStorage(object);
    }
    setRenamingId(null);
  };

  const handleDrop = (targetId: string) => {
    const canvas = fabricRef.current;
    if (!dragId || dragId === targetId || !canvas) {
      setDragId(null);
      return;
    }
    const dragged = findFabricObject(canvas, dragId);
    const target = findFabricObject(canvas, targetId);
    if (!dragged || !target) {
      setDragId(null);
      return;
    }
    const targetIndex = canvas.getObjects().indexOf(target);
    // moveTo is defined on fabric.StaticCanvas at runtime but missing from
    // @types/fabric's declarations — same gap this codebase already works
    // around elsewhere (see createCircle's `as any` cast).
    (canvas as any).moveTo(dragged, targetIndex);
    canvas.requestRenderAll();
    syncShapeInStorage(dragged);
    setDragId(null);
  };

  if (!allShapes || allShapes.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-5 py-4">
        <h3 className="font-serif text-base text-foreground">Layers</h3>
        <p className="text-xs text-muted-foreground">
          Nothing on the canvas yet — shapes you add will show up here, top layer first.
        </p>
      </div>
    );
  }

  // Fabric's z-order is back-to-front; the top-most (front) layer is the
  // most intuitive to show first, matching every other design tool's layer
  // stack convention.
  const orderedShapes = [...allShapes].reverse();

  return (
    <div className="flex flex-col gap-1 py-4">
      <h3 className="px-5 pb-2 font-serif text-base text-foreground">Layers</h3>
      <ul className="flex flex-col gap-0.5 px-2">
        {orderedShapes.map(([objectId, shape]) => {
          const { icon: Icon, name: typeName } = getShapeInfo(shape?.type);
          const isSelected = selectedId === objectId;
          const isLocked = !!shape?.locked;
          const isHidden = shape?.visible === false;
          const isRenaming = renamingId === objectId;

          return (
            <li
              key={objectId}
              draggable={!isRenaming}
              onDragStart={() => setDragId(objectId)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(objectId)}
              onClick={() => !isRenaming && handleSelect(objectId)}
              onDoubleClick={() => {
                setRenamingId(objectId);
                setRenameDraft(shape?.name || typeName);
              }}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-sm border-l-2 px-2 py-2 text-sm transition-colors",
                isSelected
                  ? "border-l-accent bg-accent/10 text-foreground"
                  : "border-l-transparent text-muted-foreground hover:bg-muted",
                isLocked && "opacity-60"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => commitRename(objectId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(objectId);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="flex-1 border-b border-accent bg-transparent text-sm text-foreground outline-none"
                />
              ) : (
                <span className="flex-1 truncate">{shape?.name || typeName}</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisible(objectId);
                }}
                aria-label={isHidden ? "Show layer" : "Hide layer"}
                className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 data-[active=true]:opacity-100"
                data-active={isHidden}
              >
                {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLocked(objectId);
                }}
                aria-label={isLocked ? "Unlock layer" : "Lock layer"}
                className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 data-[active=true]:opacity-100"
                data-active={isLocked}
              >
                {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LayersPanel;
