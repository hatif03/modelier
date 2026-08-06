"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import EditableProjectName from "@/components/EditableProjectName";
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

export type RecentItem = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
};

type Props<T extends RecentItem> = {
  title: string;
  emptyLabel: string;
  fetchUrl: string;
  listKey: string;
  query?: string;
  itemHref: (item: T) => string;
  deleteUrl: (id: string) => string;
  renamePatchUrl?: (id: string) => string;
  renameMethod?: "PATCH" | "PUT";
  renderMeta: (item: T) => React.ReactNode;
  renderHoverAction?: (item: T) => React.ReactNode;
};

// Shared by the Dashboard's project grid and Jewelry Studio's design grid —
// previously two separately-implemented, near-identical "recent items" grids
// (same fetch/aspect-square-card/hover-delete shape, each with its own copy
// of the blank-thumbnail bug: no fallback when thumbnailUrl was null).
function RecentItemsGrid<T extends RecentItem>({
  title,
  emptyLabel,
  fetchUrl,
  listKey,
  query = "",
  itemHref,
  deleteUrl,
  renamePatchUrl,
  renameMethod = "PATCH",
  renderMeta,
  renderHoverAction,
}: Props<T>) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);

  const refresh = () => {
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((json) => setItems(json[listKey] ?? []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [fetchUrl, listKey]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await fetch(deleteUrl(pendingDelete.id), { method: "DELETE" }).catch(() => {});
    setPendingDelete(null);
    refresh();
  };

  const visible = query ? items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())) : items;

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</h2>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {items.length === 0 ? emptyLabel : "No designs match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {visible.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(itemHref(item))}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-sm border border-border bg-card aspect-square hover:border-accent/60"
            >
              <div className="absolute right-2 top-2 z-10 hidden items-center gap-2 group-hover:flex">
                {renderHoverAction?.(item)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(item);
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
              <div className="relative flex-1 bg-muted/40">
                {item.thumbnailUrl ? (
                  <Image src={item.thumbnailUrl} alt={item.name} fill unoptimized className="object-contain p-2" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 border-t border-border p-3">
                {renamePatchUrl ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <EditableProjectName
                      patchUrl={renamePatchUrl(item.id)}
                      method={renameMethod}
                      initialName={item.name}
                      className="truncate text-left font-serif text-sm text-foreground hover:text-accent"
                    />
                  </div>
                ) : (
                  <p className="truncate text-left font-serif text-sm text-foreground">{item.name}</p>
                )}
                {renderMeta(item)}
                <p className="text-[10px] text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{pendingDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RecentItemsGrid;
