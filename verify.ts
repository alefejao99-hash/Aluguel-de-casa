import { json, errorJson, requireAdmin, handleError } from "../_utils/http";

export async function POST(request: Request) {
  try {
    requireAdmin(request);

    return json({
      success: true,
    });
  } catch (error) {
    return handleError(error);
  }
}

export function GET() {
  return errorJson(405, "Use POST /api/admin/verify.");
}
