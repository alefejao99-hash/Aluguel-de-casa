import type { Property } from "../../src/types";

const ALLOWED_AMENITIES = new Set([
  "wifi",
  "piscina",
  "churrasqueira",
  "ar_condicionado",
  "mobiliado",
  "garagem",
  "jardim",
  "pet_friendly",
  "frente_mar",
  "banheira_hidro",
  "academia",
]);

function cleanString(value: unknown, max = 200): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanLongString(value: unknown, max = 2000): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

function toNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}


const PLACEHOLDER_IMAGE = "/sem-foto-imovel.png";

function isPlaceholderImage(url: string) {
  const normalized = String(url || "").trim();
  return normalized === PLACEHOLDER_IMAGE || normalized.endsWith("/sem-foto-imovel.png");
}

function cleanImageUrls(value: unknown, primaryImage: string): string[] {
  const urls = Array.isArray(value) ? value : [];
  const cleaned: string[] = [];

  for (const item of urls) {
    try {
      const url = cleanImageUrl(item);
      if (!cleaned.includes(url)) cleaned.push(url);
    } catch {
      // Ignora imagens individuais inválidas para não perder o anúncio inteiro.
    }
  }

  if (primaryImage) {
    try {
      const primary = cleanImageUrl(primaryImage);
      if (!cleaned.includes(primary)) cleaned.unshift(primary);
    } catch {
      // Imagem principal inválida já será substituída pelo placeholder quando necessário.
    }
  }

  const realImages = cleaned.filter((url) => !isPlaceholderImage(url));
  return (realImages.length > 0 ? realImages : [PLACEHOLDER_IMAGE]).slice(0, 12);
}

function cleanPhone(value: unknown): string {
  let phone = String(value ?? "").replace(/\D/g, "");
  if (phone.startsWith("55") && phone.length > 11) phone = phone.slice(2);
  return phone.slice(0, 11);
}

function cleanImageUrl(value: unknown): string {
  const raw = cleanString(value, 1500);
  if (!raw) return PLACEHOLDER_IMAGE;

  const isSafeLocalImage =
    (raw.startsWith("/images/") || raw.startsWith("/uploads/")) &&
    !raw.includes("..") &&
    !raw.includes("\\") &&
    /\.(png|jpe?g|webp|gif)$/i.test(raw);

  if (isSafeLocalImage) {
    return raw;
  }

  if (raw.startsWith("data:")) {
    throw Object.assign(
      new Error(
        "Upload em base64 não deve ser salvo no anúncio. Envie para /api/upload-image e salve a URL retornada.",
      ),
      { status: 400 },
    );
  }

  try {
    const url = new URL(raw);

    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("protocol");
    }

    return url.toString();
  } catch {
    throw Object.assign(new Error("URL da imagem inválida."), { status: 400 });
  }
}

export function sanitizeProperty(
  input: Partial<Property>,
  existing?: Property,
): Property {
  const type = input.type === "mensal" ? "mensal" : "temporada";
  const amenities = Array.isArray(input.amenities)
    ? input.amenities
        .map(String)
        .filter((id) => ALLOWED_AMENITIES.has(id))
        .slice(0, 20)
    : [];

  const ownerPhone = cleanPhone(input.ownerPhone);
  if (ownerPhone.length < 10 || ownerPhone.length > 11) {
    throw Object.assign(new Error("WhatsApp inválido. Use DDD + número."), {
      status: 400,
    });
  }

  const property: Property = {
    id: existing?.id || cleanString(input.id, 80) || `casa-${Date.now()}`,
    title: cleanString(input.title, 90),
    description: cleanLongString(input.description, 1800),
    type,
    price: toNumber(input.price, type === "temporada" ? 250 : 1200, 1, 500_000),
    city: "Parnaíba",
    neighborhood: cleanString(input.neighborhood, 80) || "Centro",
    state: "PI",
    bedrooms: toNumber(input.bedrooms, 2, 0, 30),
    bathrooms: toNumber(input.bathrooms, 1, 0, 30),
    suites: toNumber(input.suites, 0, 0, 30),
    area: toNumber(input.area, 100, 1, 100_000),
    parkingSpaces: toNumber(input.parkingSpaces, 0, 0, 50),
    amenities,
    imageUrl: cleanImageUrl(input.imageUrl),
    imageUrls: [],
    ownerName: cleanString(input.ownerName, 80),
    ownerPhone,
    ownerEmail: cleanString(input.ownerEmail, 150),
    createdAt:
      existing?.createdAt ||
      cleanString(input.createdAt, 40) ||
      new Date().toISOString(),
    address: cleanString(input.address, 160),
    houseNumber: cleanString(input.houseNumber, 30),
    showExactAddress: input.showExactAddress === true,
    livingRooms: toNumber(
      input.livingRooms,
      input.hasLivingRoom === false ? 0 : 1,
      0,
      20,
    ),
    kitchens: toNumber(
      input.kitchens,
      input.hasKitchen === false ? 0 : 1,
      0,
      20,
    ),
    acceptsPets: input.acceptsPets !== false,
    hasLivingRoom: input.hasLivingRoom !== false,
    hasKitchen: input.hasKitchen !== false,
    lat:
      typeof input.lat === "number" && Number.isFinite(input.lat)
        ? input.lat
        : undefined,
    lng:
      typeof input.lng === "number" && Number.isFinite(input.lng)
        ? input.lng
        : undefined,
    ownerType: input.ownerType === "imobiliaria" ? "imobiliaria" : "particular",
  };

  property.imageUrls = cleanImageUrls(input.imageUrls, property.imageUrl);
  property.imageUrl = property.imageUrls[0] || property.imageUrl;

  if (
    !property.title ||
    !property.ownerName ||
    !property.address ||
    !property.houseNumber
  ) {
    throw Object.assign(
      new Error("Título, contato, endereço e número são obrigatórios."),
      { status: 400 },
    );
  }

  return property;
}

export function sanitizeParsedAiData(data: Record<string, unknown>) {
  const phone = cleanPhone(data.ownerPhone);
  const type = data.type === "temporada" ? "temporada" : "mensal";
  const amenities = Array.isArray(data.amenities)
    ? data.amenities
        .map(String)
        .filter((id) => ALLOWED_AMENITIES.has(id))
        .slice(0, 20)
    : [];
  const livingRooms = toNumber(data.livingRooms, 1, 0, 20);
  const kitchens = toNumber(data.kitchens, 1, 0, 20);

  return {
    title: cleanString(data.title, 90),
    description: cleanLongString(data.description, 1000),
    type,
    price: toNumber(data.price, type === "temporada" ? 250 : 1200, 1, 500_000),
    neighborhood: cleanString(data.neighborhood, 80) || "Centro",
    bedrooms: toNumber(data.bedrooms, 2, 0, 30),
    bathrooms: toNumber(data.bathrooms, 1, 0, 30),
    suites: toNumber(data.suites, 0, 0, 30),
    area: toNumber(data.area, 100, 1, 100_000),
    parkingSpaces: toNumber(data.parkingSpaces, 0, 0, 50),
    ownerName: cleanString(data.ownerName, 80),
    ownerPhone: phone || "",
    ownerEmail: cleanString(data.ownerEmail, 150),
    address: cleanString(data.address, 160),
    houseNumber: cleanString(data.houseNumber, 30) || "S/N",
    showExactAddress: data.showExactAddress === true,
    livingRooms,
    kitchens,
    acceptsPets:
      typeof data.acceptsPets === "boolean"
        ? data.acceptsPets
        : amenities.includes("pet_friendly"),
    hasLivingRoom:
      typeof data.hasLivingRoom === "boolean" ? data.hasLivingRoom : livingRooms > 0,
    hasKitchen: typeof data.hasKitchen === "boolean" ? data.hasKitchen : kitchens > 0,
    ownerType: data.ownerType === "imobiliaria" ? "imobiliaria" : "particular",
    amenities,
    city: "Parnaíba",
    state: "PI",
  };
}
