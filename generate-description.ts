import { json, readJson, getClientIp, handleError } from './_utils/http';
import { rateLimit } from './_utils/rate-limit';
import { generateWithGemini, hasGeminiKey } from './_utils/gemini';

function clean(value: unknown, max = 200) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    await rateLimit(`gemini:description:${getClientIp(request)}`, 12, 60 * 60);

    const body = await readJson<{
      title?: string;
      city?: string;
      neighborhood?: string;
      type?: string;
      price?: number | string;
      bedrooms?: number | string;
      amenities?: string[];
    }>(request, 20_000);

    const title = clean(body.title, 90);
    const city = clean(body.city, 60) || 'Parnaíba';
    const neighborhood = clean(body.neighborhood, 80);
    const type = clean(body.type, 20);
    const bedrooms = clean(body.bedrooms, 10) || '2';
    const amenitiesStr = Array.isArray(body.amenities) && body.amenities.length > 0
      ? body.amenities.map((a) => clean(a, 40)).filter(Boolean).slice(0, 15).join(', ')
      : 'padrão';
    const priceStr = body.price ? `R$ ${clean(body.price, 20)} por ${type === 'Temporada' ? 'dia' : 'mês'}` : 'Preço a combinar';

    const getFallbackDescription = () =>
      `Incrível oportunidade de aluguel ${type === 'Temporada' ? 'por temporada' : 'mensal'} em ${city}${neighborhood ? `, na região de ${neighborhood}` : ''}. Imóvel com ${bedrooms} quarto(s), boa localização e comodidades como ${amenitiesStr}. Valor de ${priceStr}. Entre em contato para tirar dúvidas e agendar uma visita.`;

    if (!hasGeminiKey()) {
      return json({ description: getFallbackDescription(), isFallback: true });
    }

    const prompt = `Você é um redator publicitário de imóveis experiente no Brasil. Escreva uma descrição curta, atraente, calorosa e moderna, com cerca de 50 a 100 palavras, em português brasileiro para anunciar um imóvel para aluguel. Não invente informações além dos dados abaixo. Gere apenas o parágrafo final, sem título, sem marcadores e sem emojis.

Dados do imóvel:
- Título: ${title}
- Tipo de locação: Aluguel ${type}
- Localização: ${neighborhood ? neighborhood + ', ' : ''}${city}
- Preço: ${priceStr}
- Quartos: ${bedrooms}
- Comodidades: ${amenitiesStr}`;

    const response = await generateWithGemini({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      contents: prompt,
    });

    const description = response.text?.trim().slice(0, 1800);
    return json({ description: description || getFallbackDescription(), isFallback: !description });
  } catch (error) {
    console.error('generate-description failed:', error);
    return handleError(error);
  }
}
