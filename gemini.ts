import { GoogleGenAI, Type } from '@google/genai';

const cooldownUntil = new Map<string, number>();
let cursor = 0;

function getKeys() {
  const multi = process.env.GEMINI_API_KEYS
    ?.split(',')
    .map((key) => key.trim())
    .filter(Boolean) || [];
  const single = process.env.GEMINI_API_KEY?.trim();
  return multi.length > 0 ? multi : single ? [single] : [];
}

function isRateLimitError(error: unknown) {
  const anyErr = error as { status?: number; message?: string; code?: number };
  const msg = String(anyErr?.message || '').toLowerCase();
  return anyErr?.status === 429 || anyErr?.code === 429 || msg.includes('resource_exhausted') || msg.includes('rate limit') || msg.includes('quota');
}

function getAvailableKey() {
  const keys = getKeys();
  if (keys.length === 0) return null;
  const now = Date.now();

  for (let i = 0; i < keys.length; i += 1) {
    const index = (cursor + i) % keys.length;
    const key = keys[index];
    if ((cooldownUntil.get(key) || 0) <= now) {
      cursor = (index + 1) % keys.length;
      return key;
    }
  }

  return null;
}

export function hasGeminiKey() {
  return getKeys().length > 0;
}

export async function generateWithGemini(args: Parameters<GoogleGenAI['models']['generateContent']>[0]) {
  const keys = getKeys();
  if (keys.length === 0) {
    throw Object.assign(new Error('Nenhuma chave Gemini configurada.'), { status: 503 });
  }

  let lastError: unknown;
  for (let attempts = 0; attempts < keys.length; attempts += 1) {
    const key = getAvailableKey();
    if (!key) break;

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      return await ai.models.generateContent(args);
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) {
        cooldownUntil.set(key, Date.now() + 60_000);
        continue;
      }
      throw error;
    }
  }

  throw Object.assign(lastError instanceof Error ? lastError : new Error('Todas as chaves Gemini estão em cooldown.'), { status: 429 });
}

export const GeminiType = Type;
