import crypto from "node:crypto";
export type JsonValue =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export function json(data: JsonValue, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorJson(
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return json({ success: false, error: message, ...extra }, { status });
}

export async function readJson<T = unknown>(
  request: Request,
  maxChars = 100_000,
): Promise<T> {
  const text = await request.text();
  if (text.length > maxChars) {
    throw Object.assign(new Error("Payload muito grande."), { status: 413 });
  }
  try {
    return JSON.parse(text || "{}") as T;
  } catch {
    throw Object.assign(new Error("JSON inválido."), { status: 400 });
  }
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function requireAdmin(request: Request) {
  const expected = process.env.SITE_ADMIN_TOKEN;

  if (!expected || expected.length < 24) {
    throw Object.assign(
      new Error("SITE_ADMIN_TOKEN não configurado ou muito fraco."),
      { status: 500 },
    );
  }

  const received = request.headers.get("x-admin-token") || "";

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  const isValid =
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!isValid) {
    throw Object.assign(new Error("Acesso administrativo negado."), {
      status: 401,
    });
  }
}

export function handleError(err: unknown) {
  const e = err as Error & { status?: number };
  const status = typeof e.status === "number" ? e.status : 500;
  const message = status >= 500 ? "Erro interno no servidor." : e.message;
  if (status >= 500) console.error(err);
  return errorJson(status, message);
}
