import { MousePointer2 } from "lucide-react";

const EmptyState = () => (
  <div className="flex flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
    <MousePointer2 className="h-6 w-6 text-muted-foreground" />
    <p className="text-xs text-muted-foreground">Select an object on the canvas to edit its properties.</p>
  </div>
);

export default EmptyState;
