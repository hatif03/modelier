// Shared, provider-agnostic shapes for the Style Assistant. Every adapter in
// providers/* translates to/from these — the route and the client only ever
// speak this dialect, never a specific vendor's wire format, which is what
// makes swapping ASSISTANT_PROVIDER a config change instead of a rewrite.
export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AssistantMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ToolCall[] }
  | { role: "tool"; toolCallId: string; toolName: string; content: string };

export type ToolDefinition = {
  name: string;
  description: string;
  /** JSON Schema (object type) describing the tool's arguments. */
  parameters: Record<string, unknown>;
};

export type ProviderTurnResult = { type: "text"; text: string } | { type: "tool_calls"; calls: ToolCall[] };

export interface AssistantProvider {
  chat(messages: AssistantMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<ProviderTurnResult>;
}

export type AssistantProviderId = "anthropic" | "openai" | "gemini" | "k2think" | "groq";
