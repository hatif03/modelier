import type { AssistantProvider, AssistantProviderId } from "../types";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAICompatibleProvider } from "./openaiCompatible";
import { createGeminiProvider } from "./gemini";

// Swapping the assistant's backend is a one-line env var change — no code
// changes, no redeploy of a different build — as long as the target
// provider's own credentials are set. See .env.example for the full list.
export function resolveAssistantProviderId(): AssistantProviderId {
  const raw = (process.env.ASSISTANT_PROVIDER || "anthropic").toLowerCase();
  if (raw === "anthropic" || raw === "openai" || raw === "gemini" || raw === "k2think" || raw === "groq") return raw;
  throw new Error(`Unknown ASSISTANT_PROVIDER "${raw}" — expected anthropic, openai, gemini, k2think, or groq.`);
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
      // K2 Think (MBZUAI Institute of Foundation Models), hosted at
      // api.k2think.ai — an OpenAI-compatible chat-completions endpoint.
      // K2THINK_BASE_URL is still configurable in case you're self-hosting
      // instead (e.g. a local vLLM server).
      return createOpenAICompatibleProvider({
        apiKey: requireEnv("K2THINK_API_KEY"),
        baseURL: process.env.K2THINK_BASE_URL || "https://api.k2think.ai/v1",
        model: process.env.K2THINK_MODEL || "MBZUAI-IFM/K2-Think-v2",
      });
    case "groq":
      // Groq serves its hosted models through the same OpenAI-compatible
      // chat-completions shape, at a fixed, publicly documented base URL.
      return createOpenAICompatibleProvider({
        apiKey: requireEnv("GROQ_API_KEY"),
        baseURL: "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — required for the current ASSISTANT_PROVIDER.`);
  return value;
}
