import { createCvAssistant } from './assistant';

afterEach(() => vi.unstubAllGlobals());

describe('createCvAssistant', () => {
  it('returns null when the Prompt API is missing', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    expect(await createCvAssistant('ctx', 'en')).toBeNull();
  });

  it('returns null when the model is not available yet (no silent download)', async () => {
    vi.stubGlobal('LanguageModel', { availability: async () => 'downloadable', create: vi.fn() });
    expect(await createCvAssistant('ctx', 'en')).toBeNull();
  });

  it('returns null when the API throws', async () => {
    vi.stubGlobal('LanguageModel', { availability: async () => { throw new Error('boom'); } });
    expect(await createCvAssistant('ctx', 'en')).toBeNull();
  });

  it('answers through the session and closes it', async () => {
    const destroy = vi.fn();
    const prompt = vi.fn(async () => 'Answer.');
    const create = vi.fn(async () => ({ prompt, destroy }));
    vi.stubGlobal('LanguageModel', { availability: async () => 'available', create });
    const a = await createCvAssistant('ctx', 'en');
    expect(a).not.toBeNull();
    expect(await a!.ask('Who?')).toBe('Answer.');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ initialPrompts: expect.any(Array) }));
    a!.close();
    expect(destroy).toHaveBeenCalled();
  });
});
