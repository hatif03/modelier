import { GoogleGenerativeAI, SchemaType, type Content, type FunctionDeclarationSchema, type Part } from "@google/generative-ai";

import type { AssistantMessage, AssistantProvider, ProviderTurnResult, ToolCall, ToolDefinition } from "../types";

// Gemini's function-calling schema uses its own SchemaType enum (uppercase
// "OBJECT"/"STRING"/...) instead of plain JSON Schema's lowercase type
// strings, and doesn't support every JSON Schema keyword (e.g. `pattern`) —
// converted here rather than hand-authoring a second schema per tool.
const JSON_SCHEMA_TYPE_MAP: Record<string, SchemaType> = {
  object: SchemaType.OBJECT,
  string: SchemaType.STRING,
  number: SchemaType.NUMBER,
  integer: SchemaType.INTEGER,
  boolean: SchemaType.BOOLEAN,
  array: SchemaType.ARRAY,
};

function toGeminiSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== "object") return schema;
  const input = schema as Record<string, unknown>;
  const output: Record<string, unknown> = { ...input };
  delete output.pattern; // unsupported by Gemini's schema — validation-only in our tool defs anyway

  if (typeof input.type === "string" && JSON_SCHEMA_TYPE_MAP[input.type]) {
    output.type = JSON_SCHEMA_TYPE_MAP[input.type];
  }
  if (input.properties && typeof input.properties === "object") {
    output.properties = Object.fromEntries(
      Object.entries(input.properties as Record<string, unknown>).map(([key, value]) => [key, toGeminiSchema(value)])
    );
  }
  if (input.items) output.items = toGeminiSchema(input.items);
  return output;
}

// Gemini matches function responses back to calls by NAME, not by an id the
// way Anthropic/OpenAI do — our neutral ToolCall.id is a synthetic
// `${name}-${index}` stamped on the way out (see below) purely so the rest
// of the app's tool-execution code can treat every provider identically.
function toGeminiHistory(messages: AssistantMessage[]): Content[] {
  const history: Content[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      history.push({ role: "user", parts: [{ text: m.content }] });
    } else if (m.role === "tool") {
      history.push({
        role: "function",
        parts: [{ functionResponse: { name: m.toolName, response: { result: m.content } } }],
      });
    } else {
      const parts: Part[] = [];
      if (m.content) parts.push({ text: m.content });
      for (const call of m.toolCalls ?? []) {
        parts.push({ functionCall: { name: call.name, args: call.arguments } });
      }
      history.push({ role: "model", parts });
    }
  }
  return history;
}

export function createGeminiProvider(): AssistantProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set — required when ASSISTANT_PROVIDER=gemini.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return {
    async chat(messages: AssistantMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<ProviderTurnResult> {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        tools: [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: toGeminiSchema(t.parameters) as FunctionDeclarationSchema,
            })),
          },
        ],
      });

      const history = toGeminiHistory(messages);
      const last = history.pop();
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last?.parts ?? []);

      const functionCalls = result.response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const calls: ToolCall[] = functionCalls.map((call, index) => ({
          id: `${call.name}-${index}`,
          name: call.name,
          arguments: (call.args as Record<string, unknown>) ?? {},
        }));
        return { type: "tool_calls", calls };
      }

      return { type: "text", text: result.response.text() };
    },
  };
}
