import { json, getClientIp, handleError } from './_utils/http';
import { incrementStat } from './_utils/storage';
import { rateLimit } from './_utils/rate-limit';

export async function GET(request: Request) {
  try {
    // Evita inflar contador com refresh/recarregamento em massa do mesmo IP.
    await rateLimit(`visitors:${getClientIp(request)}`, 5, 60 * 60);
    const stats = await incrementStat('visitorCount');
    return json({ count: stats.visitorCount });
  } catch (error) {
    return handleError(error);
  }
}
