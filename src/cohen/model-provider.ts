// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * AI provider abstraction. Source: 02_SYSTEM_ARCHITECTURE.md "AI provider
 * abstraction". No product logic may depend on one model vendor.
 */

export interface StructuredPrompt<T> {
  system: string;
  input: string;
  /** Description only, for demo/documentation purposes — no runtime schema library dependency. */
  shape: string;
  parse: (raw: string) => T;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface ModelProvider {
  completeStructured<T>(request: StructuredPrompt<T>): Promise<T>;
  chat(request: ChatRequest): Promise<ChatResponse>;
}

/**
 * Demo/default provider: deterministic, no external API call, no API key
 * required (PROMPT_TO_START_CLAUDE_CODE.md #7 "Do not require real API
 * credentials to run the demo"). Swap `MODEL_PROVIDER` in .env to point
 * ModelProvider consumers at a real implementation later without touching
 * Cohen's orchestration logic.
 */
export const deterministicModelProvider: ModelProvider = {
  async completeStructured<T>(request: StructuredPrompt<T>): Promise<T> {
    return request.parse("{}");
  },
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    return {
      message: {
        role: "assistant",
        content: lastUser
          ? `I can help with that once a live model provider is configured. For now, try one of the suggested questions.`
          : "How can I help?"
      }
    };
  }
};
