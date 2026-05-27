import { json, getClientIp, handleError } from '../_utils/http';
import { incrementStat } from '../_utils/storage';
import { rateLimit } from '../_utils/rate-limit';

export async function POST(request: Request) {
  try {
    await rateLimit(`click-group:${getClientIp(request)}`, 30, 60 * 60);
    return json(await incrementStat('groupClicksCount'));
  } catch (error) {
    return handleError(error);
  }
}
