import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

import type { AssistantMessage, AssistantProvider, ProviderTurnResult, ToolDefinition } from "../types";

// Shared by the real OpenAI provider and the K2 Think (MBZUAI) provider — K2
// Think is served through an OpenAI-compatible chat-completions endpoint, so
// the only real difference between the two is which baseURL/apiKey/model get
// passed in here.
export function createOpenAICompatibleProvider(opts: { apiKey: string; baseURL?: string; model: string }): AssistantProvider {
  const client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL });

  return {
    async chat(messages: AssistantMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<ProviderTurnResult> {
      const chatMessages: ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }];
      for (const m of messages) {
        if (m.role === "user") {
          chatMessages.push({ role: "user", content: m.content });
        } else if (m.role === "tool") {
          chatMessages.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content });
        } else {
          chatMessages.push({
            role: "assistant",
            content: m.content || null,
            tool_calls: (m.toolCalls ?? []).map((call) => ({
              id: call.id,
              type: "function",
              function: { name: call.name, arguments: JSON.stringify(call.arguments) },
            })),
          });
        }
      }

      const chatTools: ChatCompletionTool[] = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));

      const response = await client.chat.completions.create({
        model: opts.model,
        messages: chatMessages,
        tools: chatTools,
      });

      const message = response.choices[0]?.message;
      const toolCalls = message?.tool_calls?.filter((c): c is Extract<typeof c, { type: "function" }> => c.type === "function");
      if (toolCalls && toolCalls.length > 0) {
        return {
          type: "tool_calls",
          calls: toolCalls.map((c) => ({
            id: c.id,
            name: c.function.name,
            arguments: safeParseJson(c.function.arguments),
          })),
        };
      }

      return { type: "text", text: message?.content ?? "" };
    },
  };
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
