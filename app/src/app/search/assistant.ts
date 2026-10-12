export interface CvAssistant {
  ask(question: string): Promise<string>;
  close(): void;
}

interface LanguageModelApi {
  availability(): Promise<string>;
  create(options: { initialPrompts: { role: string; content: string }[] }): Promise<{
    prompt(q: string): Promise<string>;
    destroy(): void;
  }>;
}

/**
 * Chrome's built-in Prompt API, feature-detected. Only used when the model is already
 * 'available' (never triggers a download). Any failure means "no assistant": the palette
 * then offers plain search.
 */
export async function createCvAssistant(context: string, locale: string): Promise<CvAssistant | null> {
  const api = (globalThis as { LanguageModel?: LanguageModelApi }).LanguageModel;
  if (!api) return null;
  try {
    if ((await api.availability()) !== 'available') return null;
    const session = await api.create({
      initialPrompts: [{
        role: 'system',
        content:
          'You answer questions about the person described in the CV text below, using only that text. ' +
          'If the answer is not in the text, say you cannot find it. Answer in the language of the question ' +
          `(the page language is "${locale}"), in at most three short sentences, without lists.\n\nCV:\n${context}`,
      }],
    });
    return { ask: (q) => session.prompt(q), close: () => session.destroy() };
  } catch {
    return null;
  }
}
