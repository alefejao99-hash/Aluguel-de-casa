import { put } from '@vercel/blob';
import crypto from 'node:crypto';
import { json, errorJson, readJson, getClientIp, handleError } from './_utils/http';
import { rateLimit } from './_utils/rate-limit';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw Object.assign(new Error('Imagem inválida. Use JPG, PNG ou WEBP.'), { status: 400 });
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!ALLOWED.has(contentType)) throw Object.assign(new Error('Tipo de imagem não permitido.'), { status: 400 });
  if (buffer.byteLength > MAX_BYTES) throw Object.assign(new Error('Imagem muito grande. Envie uma imagem de até 3 MB.'), { status: 413 });
  return { contentType, buffer };
}

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return errorJson(500, 'Vercel Blob não configurado. Defina BLOB_READ_WRITE_TOKEN ou use uma URL de imagem externa.');
    }

    await rateLimit(`upload-image:${getClientIp(request)}`, 15, 60 * 60);
    const body = await readJson<{ dataUrl?: string; filename?: string }>(request, 4_200_000);
    const { contentType, buffer } = parseDataUrl(String(body.dataUrl || ''));
    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const safeName = String(body.filename || 'imagem')
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9._-]+/g, '-')
      .slice(0, 80);
    const imageId = `property-image-${crypto.randomUUID()}`;
    const blob = await put(`properties/${imageId}-${safeName || 'imagem'}.${ext}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });

    return json({ success: true, url: blob.url, imageId });
  } catch (error) {
    return handleError(error);
  }
}
