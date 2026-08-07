import Anthropic from "@anthropic-ai/sdk";

import type { AssistantMessage, AssistantProvider, ProviderTurnResult, ToolDefinition } from "../types";

function toAnthropicMessages(messages: AssistantMessage[]): Anthropic.MessageParam[] {
  return messages.map((m): Anthropic.MessageParam => {
    if (m.role === "user") {
      return { role: "user", content: m.content };
    }
    if (m.role === "tool") {
      return {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }],
      };
    }
    const content: Anthropic.ContentBlockParam[] = [];
    if (m.content) content.push({ type: "text", text: m.content });
    for (const call of m.toolCalls ?? []) {
      content.push({ type: "tool_use", id: call.id, name: call.name, input: call.arguments });
    }
    return { role: "assistant", content };
  });
}

export function createAnthropicProvider(): AssistantProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — required when ASSISTANT_PROVIDER=anthropic.");

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  return {
    async chat(messages: AssistantMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<ProviderTurnResult> {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters as Anthropic.Tool.InputSchema })),
        messages: toAnthropicMessages(messages),
      });

      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (toolUseBlocks.length > 0) {
        return {
          type: "tool_calls",
          calls: toolUseBlocks.map((b) => ({ id: b.id, name: b.name, arguments: (b.input as Record<string, unknown>) ?? {} })),
        };
      }

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { type: "text", text };
    },
  };
}
