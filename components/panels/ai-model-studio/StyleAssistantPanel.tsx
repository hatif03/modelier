"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { Send } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { modifyShape, insertImageFromUrl } from "@/lib/shapes";
import { startGeneration, pollGeneration } from "@/lib/ai-model-studio/api";
import { buildBackdropPrompt, BACKDROP_PRESETS } from "@/lib/ai-model-studio/backdrops";
import type { AssistantMessage, ToolCall } from "@/lib/assistant/types";

type ChatEntry =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "activity"; text: string }
  | { kind: "image"; url: string };

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

const SUGGESTIONS = [
  "Generate an editorial backdrop with warm tones",
  "Make the selected object hot pink",
  "Move the selected object up and to the left",
];

// Tool execution lives entirely on the client — the server-side route only
// decides WHICH tool to call and with what arguments (see app/api/assistant/route.ts).
// generate_backdrop reuses the exact same generation pipeline the Backdrop
// flow uses (lib/ai-model-studio/api.ts); recolor/transform are direct
// fabric.js ops, same as RightSidebar's own Color/Arrange controls.
const StyleAssistantPanel = ({ fabricRef, activeObjectRef, shapeRef, syncShapeInStorage }: Props) => {
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, isThinking]);

  const executeTool = async (call: ToolCall): Promise<string> => {
    if (call.name === "generate_backdrop") {
      const presetId = String(call.arguments.presetId ?? "");
      const extraDetail = String(call.arguments.extraDetail ?? "");
      const presetLabel = BACKDROP_PRESETS.find((p) => p.id === presetId)?.label ?? "custom";
      setEntries((prev) => [...prev, { kind: "activity", text: `🎨 Generating a ${presetLabel} backdrop…` }]);
      try {
        let generation = await startGeneration({
          file: null,
          flow: "backdrop",
          referenceModelIds: [],
          prompt: buildBackdropPrompt(presetId, extraDetail),
        });
        for (let i = 0; i < 20 && generation.status === "processing"; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          generation = await pollGeneration(generation);
        }
        const variant = generation.variants[0];
        if (variant?.status === "success" && variant.resultImageUrl) {
          setEntries((prev) => [...prev, { kind: "image", url: variant.resultImageUrl as string }]);
          return "Generated the backdrop — shown above, with an Add to canvas button.";
        }
        return variant?.errorMessage ?? "Still processing — check the Backdrop tab in a moment.";
      } catch (err) {
        return err instanceof Error ? err.message : "Failed to generate the backdrop.";
      }
    }

    if (call.name === "recolor_selection") {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!canvas || !obj) return "Nothing is selected on the canvas right now.";
      const hex = String(call.arguments.hex ?? "");
      modifyShape({ canvas, property: "fill", value: hex, activeObjectRef, syncShapeInStorage });
      return `Recolored the selected object to ${hex}.`;
    }

    if (call.name === "transform_selection") {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!canvas || !obj) return "Nothing is selected on the canvas right now.";
      const dx = Number(call.arguments.dx ?? 0);
      const dy = Number(call.arguments.dy ?? 0);
      const scaleFactor = call.arguments.scaleFactor ? Number(call.arguments.scaleFactor) : undefined;
      if (dx || dy) obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
      if (scaleFactor) {
        obj.scaleX = (obj.scaleX ?? 1) * scaleFactor;
        obj.scaleY = (obj.scaleY ?? 1) * scaleFactor;
      }
      obj.setCoords();
      canvas.requestRenderAll();
      syncShapeInStorage(obj);
      return "Done.";
    }

    return `Unknown tool: ${call.name}`;
  };

  const runTurn = async (nextHistory: AssistantMessage[]) => {
    setIsThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "The assistant couldn't process that request.");

      if (json.type === "tool_calls") {
        const calls: ToolCall[] = json.calls;
        const assistantMsg: AssistantMessage = { role: "assistant", content: "", toolCalls: calls };
        const toolResults: AssistantMessage[] = [];
        for (const call of calls) {
          const resultText = await executeTool(call);
          toolResults.push({ role: "tool", toolCallId: call.id, toolName: call.name, content: resultText });
        }
        const updated = [...nextHistory, assistantMsg, ...toolResults];
        setHistory(updated);
        await runTurn(updated);
        return;
      }

      const updated: AssistantMessage[] = [...nextHistory, { role: "assistant", content: json.text }];
      setHistory(updated);
      setEntries((prev) => [...prev, { kind: "assistant", text: json.text }]);
      setIsThinking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant couldn't process that request.");
      setIsThinking(false);
    }
  };

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isThinking) return;
    setInput("");
    setEntries((prev) => [...prev, { kind: "user", text: message }]);
    runTurn([...history, { role: "user", content: message }]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-4">
        <h3 className="font-serif text-base text-foreground">Style Assistant</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask for a backdrop, or tell it to recolor or move whatever&apos;s selected on the canvas.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3">
        {entries.length === 0 && (
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="rounded-sm border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:border-accent/60 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => {
            if (entry.kind === "user") {
              return (
                <div key={i} className="ml-8 rounded-lg rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
                  {entry.text}
                </div>
              );
            }
            if (entry.kind === "assistant") {
              return (
                <div key={i} className="mr-8 rounded-lg rounded-bl-sm border border-border bg-card px-3 py-2 text-xs text-foreground">
                  {entry.text}
                </div>
              );
            }
            if (entry.kind === "activity") {
              return (
                <p key={i} className="text-[11px] italic text-muted-foreground">
                  {entry.text}
                </p>
              );
            }
            return (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-2">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.url} alt="Generated backdrop" className="h-full w-full object-cover" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border bg-background hover:border-accent hover:bg-background hover:text-accent"
                  onClick={() => insertImageFromUrl({ url: entry.url, canvas: fabricRef as any, shapeRef, syncShapeInStorage })}
                >
                  Add to canvas
                </Button>
              </div>
            );
          })}
          {isThinking && <p className="text-[11px] italic text-muted-foreground">Thinking…</p>}
        </div>
      </div>

      {error && <p className="px-5 pb-2 text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 border-t border-border px-5 py-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask for a backdrop, or a canvas change…"
          className="input-ring flex-1 border border-border bg-background"
        />
        <Button size="icon" disabled={isThinking || !input.trim()} onClick={() => handleSend()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StyleAssistantPanel;
