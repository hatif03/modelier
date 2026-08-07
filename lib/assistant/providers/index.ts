import type { AssistantProvider, AssistantProviderId } from "../types";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAICompatibleProvider } from "./openaiCompatible";
import { createGeminiProvider } from "./gemini";

// Swapping the assistant's backend is a one-line env var change — no code
// changes, no redeploy of a different build — as long as the target
// provider's own credentials are set. See .env.example for the full list.
export function resolveAssistantProviderId(): AssistantProviderId {
  const raw = (process.env.ASSISTANT_PROVIDER || "anthropic").toLowerCase();
  if (raw === "anthropic" || raw === "openai" || raw === "gemini" || raw === "k2think") return raw;
  throw new Error(`Unknown ASSISTANT_PROVIDER "${raw}" — expected anthropic, openai, gemini, or k2think.`);
}

export function getAssistantProvider(id: AssistantProviderId = resolveAssistantProviderId()): AssistantProvider {
  switch (id) {
    case "anthropic":
      return createAnthropicProvider();
    case "openai":
      return createOpenAICompatibleProvider({
        apiKey: requireEnv("OPENAI_API_KEY"),
        model: process.env.OPENAI_MODEL || "gpt-4.1",
      });
    case "gemini":
      return createGeminiProvider();
    case "k2think":
      // K2 Think (MBZUAI Institute of Foundation Models) is served through an
      // OpenAI-compatible chat-completions endpoint — point K2THINK_BASE_URL
      // at whichever inference host serves it (self-hosted vLLM, or a
      // provider that hosts it), no separate SDK needed.
      return createOpenAICompatibleProvider({
        apiKey: process.env.K2THINK_API_KEY || "not-required",
        baseURL: requireEnv("K2THINK_BASE_URL"),
        model: process.env.K2THINK_MODEL || "LLM360/K2-Think-V2",
      });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — required for the current ASSISTANT_PROVIDER.`);
  return value;
}
