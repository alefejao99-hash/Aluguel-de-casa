import fs from 'fs';
import path from 'path';
import { del } from '@vercel/blob';
import type { Property } from '../../src/types';

const PLACEHOLDER_IMAGE = '/images/sem-foto-imovel.png';
const SAFE_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;

type CleanupResult = {
  attempted: number;
  deleted: number;
  skipped: number;
  errors: string[];
};

function isPlaceholderImage(url: string) {
  const normalized = String(url || '').trim();
  return normalized === PLACEHOLDER_IMAGE || normalized.endsWith('/sem-foto-imovel.png');
}

function getPropertyImageUrls(property?: Partial<Property> | null): string[] {
  if (!property) return [];

  const rawUrls = [
    property.imageUrl,
    ...(Array.isArray(property.imageUrls) ? property.imageUrls : []),
  ];

  return rawUrls
    .map((url) => String(url || '').trim())
    .filter(Boolean)
    .filter((url) => !isPlaceholderImage(url))
    .filter((url, index, arr) => arr.indexOf(url) === index);
}

function imageIsReferencedByOtherProperty(url: string, properties: Partial<Property>[]) {
  return properties.some((property) => getPropertyImageUrls(property).includes(url));
}

function resolveManagedLocalUpload(url: string) {
  if (!url.startsWith('/uploads/')) return null;
  if (url.includes('..') || url.includes('\\') || !SAFE_IMAGE_EXTENSIONS.test(url)) return null;

  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(process.cwd(), 'public', url.replace(/^\//, ''));

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return null;
  return filePath;
}

function isManagedBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return false;
    return parsed.pathname.startsWith('/properties/') && SAFE_IMAGE_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
}

export async function deletePropertyImages(
  deletedProperty: Partial<Property> | null | undefined,
  remainingProperties: Partial<Property>[],
): Promise<CleanupResult> {
  const result: CleanupResult = {
    attempted: 0,
    deleted: 0,
    skipped: 0,
    errors: [],
  };

  const urls = getPropertyImageUrls(deletedProperty);

  for (const url of urls) {
    if (imageIsReferencedByOtherProperty(url, remainingProperties)) {
      result.skipped += 1;
      continue;
    }

    const localFilePath = resolveManagedLocalUpload(url);

    if (localFilePath) {
      result.attempted += 1;
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
          result.deleted += 1;
        } else {
          result.skipped += 1;
        }
      } catch (error) {
        result.errors.push(`Falha ao excluir arquivo local ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
      continue;
    }

    if (isManagedBlobUrl(url)) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        result.skipped += 1;
        result.errors.push(`Imagem no Blob não excluída porque BLOB_READ_WRITE_TOKEN não está configurado: ${url}`);
        continue;
      }

      result.attempted += 1;
      try {
        await del(url);
        result.deleted += 1;
      } catch (error) {
        result.errors.push(`Falha ao excluir imagem do Blob ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
      continue;
    }

    // URL externa ou imagem do diretório /images: não é gerenciada pelo sistema.
    result.skipped += 1;
  }

  return result;
}
