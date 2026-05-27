import { json, handleError } from './_utils/http';
import { getStats } from './_utils/storage';

export async function GET() {
  try {
    return json(await getStats());
  } catch (error) {
    return handleError(error);
  }
}
