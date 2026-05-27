import { json, errorJson, requireAdmin, handleError } from '../_utils/http';
import { getProperties, saveProperties } from '../_utils/storage';
import { deletePropertyImages } from '../_utils/image-cleanup';

function getIdFromRequest(request: Request) {
  const url = new URL(request.url);
  return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
}

export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    const id = getIdFromRequest(request);
    if (!id) return errorJson(400, 'ID do anúncio não informado.');

    const properties = await getProperties();
    const deletedProperty = properties.find((p) => p.id === id);
    const updated = properties.filter((p) => p.id !== id);
    if (!deletedProperty) return errorJson(404, 'Anúncio não encontrado.');

    await saveProperties(updated);
    const cleanup = await deletePropertyImages(deletedProperty, updated);

    return json({ success: true, deletedImages: cleanup.deleted, skippedImages: cleanup.skipped });
  } catch (error) {
    return handleError(error);
  }
}
