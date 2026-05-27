import { json, errorJson, readJson, getClientIp } from './_utils/http';
import { rateLimit } from './_utils/rate-limit';
import { generateWithGemini, hasGeminiKey, GeminiType as Type } from './_utils/gemini';
import { sanitizeParsedAiData } from './_utils/sanitize';
import {
  buildParseQuickAdPrompt,
  fallbackParsedProperty,
  getParseQuickAdSchema,
  parseGeminiJson,
} from './_utils/parse-ai-property';

export async function POST(request: Request) {
  let text = '';

  try {
    await rateLimit(`gemini:parse:${getClientIp(request)}`, 10, 60 * 60);

    const body = await readJson<{ text?: string }>(request, 30_000);
    text = String(body.text || '').trim().slice(0, 4000);

    if (!text) {
      return errorJson(400, 'Informe os dados do imóvel antes de usar a IA.');
    }

    if (!hasGeminiKey()) {
      return json({
        success: true,
        data: fallbackParsedProperty(text),
        isFallback: true,
        message: 'Cadastro organizado por análise local. Configure a chave Gemini para melhorar a precisão.',
      });
    }

    const response = await generateWithGemini({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      contents: buildParseQuickAdPrompt(text),
      config: {
        responseMimeType: 'application/json',
        responseSchema: getParseQuickAdSchema(Type),
      },
    });

    const raw = response.text?.trim();
    if (!raw) throw new Error('Resposta vazia do Gemini.');

    const parsed = sanitizeParsedAiData(parseGeminiJson(raw));

    return json({
      success: true,
      data: parsed,
      isFallback: false,
      message: 'Informações organizadas pela IA. Revise os campos antes de publicar.',
    });
  } catch (error) {
    console.error('parse-quick-ad failed:', error);
    return json({
      success: true,
      data: fallbackParsedProperty(text),
      isFallback: true,
      message: 'A IA não conseguiu concluir a análise. Organizamos os dados possíveis automaticamente; revise os campos antes de publicar.',
    });
  }
}
