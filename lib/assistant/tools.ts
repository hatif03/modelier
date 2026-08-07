import { BACKDROP_PRESETS } from "@/lib/ai-model-studio/backdrops";
import type { ToolDefinition } from "./types";

// A small, reliable tool set for the assistant's first cut — generation
// (Magic Backdrop), recoloring, and layout — rather than every possible
// canvas/generation action at once. Each maps to something the client can
// execute deterministically (components/panels/ai-model-studio/StyleAssistantPanel.tsx).
export const ASSISTANT_TOOLS: ToolDefinition[] = [
  {
    name: "generate_backdrop",
    description:
      "Generate a new product-photography backdrop/scene image from a curated preset plus optional extra detail. Use this when the user asks for a background, scene, or setting to be created.",
    parameters: {
      type: "object",
      properties: {
        presetId: {
          type: "string",
          enum: BACKDROP_PRESETS.map((p) => p.id),
          description: "Which curated scene preset to base the backdrop on.",
        },
        extraDetail: {
          type: "string",
          description: "Optional extra detail to blend into the prompt, e.g. 'pastel pink tones, marble floor'.",
        },
      },
      required: ["presetId"],
    },
  },
  {
    name: "recolor_selection",
    description:
      "Change the fill color of whatever object is currently selected on the canvas. Fails gracefully if nothing is selected.",
    parameters: {
      type: "object",
      properties: {
        hex: {
          type: "string",
          pattern: "^#[0-9a-fA-F]{6}$",
          description: "The target color as a 6-digit hex code, e.g. '#FF2E7E'.",
        },
      },
      required: ["hex"],
    },
  },
  {
    name: "transform_selection",
    description:
      "Move and/or resize whatever object is currently selected on the canvas. Fails gracefully if nothing is selected.",
    parameters: {
      type: "object",
      properties: {
        dx: { type: "number", description: "Horizontal move in canvas pixels, positive = right." },
        dy: { type: "number", description: "Vertical move in canvas pixels, positive = down." },
        scaleFactor: {
          type: "number",
          description: "Multiplies the object's current scale, e.g. 1.2 to grow 20%, 0.8 to shrink 20%.",
        },
      },
      required: [],
    },
  },
];
