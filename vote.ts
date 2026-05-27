import { json, errorJson, readJson, getClientIp, handleError } from '../_utils/http';
import { incrementStat, getStats } from '../_utils/storage';
import { rateLimit } from '../_utils/rate-limit';

export async function POST(request: Request) {
  try {
    await rateLimit(`vote:${getClientIp(request)}`, 1, 24 * 60 * 60);
    const body = await readJson<{ type?: string }>(request, 5000);
    if (body.type !== 'like' && body.type !== 'dislike') {
      return errorJson(400, 'Tipo de voto inválido.');
    }
    const field = body.type === 'like' ? 'likes' : 'dislikes';
    return json(await incrementStat(field));
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  try {
    return json(await getStats());
  } catch (error) {
    return handleError(error);
  }
}
