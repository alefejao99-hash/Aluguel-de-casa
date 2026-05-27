import { json, errorJson, readJson, getClientIp, requireAdmin, handleError } from './_utils/http';
import { getProperties, saveProperties } from './_utils/storage';
import { sanitizeProperty } from './_utils/sanitize';
import { deletePropertyImages } from './_utils/image-cleanup';
import { rateLimit } from './_utils/rate-limit';
import type { Property } from '../src/types';

export async function GET() {
  try {
    const properties = await getProperties();
    return json(properties);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await rateLimit(`properties:post:${getClientIp(request)}`, 8, 60 * 60);

    const body = await readJson<Partial<Property>>(request, 120_000);
    const properties = await getProperties();

    const requestedId = typeof body.id === 'string' ? body.id : '';
    const existing = requestedId ? properties.find((p) => p.id === requestedId) : undefined;

    if (existing) {
      requireAdmin(request);
    }

    const property = sanitizeProperty(
      {
        ...body,
        id: existing ? existing.id : `casa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      existing,
    );

    const updated = existing
      ? properties.map((p) => (p.id === existing.id ? property : p))
      : [property, ...properties];

    await saveProperties(updated);

    if (existing) {
      const cleanup = await deletePropertyImages(existing, updated);
      if (cleanup.errors.length > 0) {
        console.warn('Algumas imagens antigas não foram excluídas após editar anúncio:', cleanup.errors);
      }
    }

    return json({ success: true, property });
  } catch (error) {
    return handleError(error);
  }
}

export function DELETE() {
  return errorJson(405, 'Use DELETE /api/properties/:id.');
}
