import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { sanitizeProperty, sanitizeParsedAiData } from "./api/_utils/sanitize";
import {
  buildParseQuickAdPrompt,
  fallbackParsedProperty,
  getParseQuickAdSchema,
  parseGeminiJson,
} from "./api/_utils/parse-ai-property";
import { generateWithGemini, hasGeminiKey } from "./api/_utils/gemini";
import crypto from "node:crypto";
import { deletePropertyImages } from "./api/_utils/image-cleanup";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  const requestPath = decodeURIComponent(req.path);

  const isViteDevInternal =
    process.env.NODE_ENV !== "production" &&
    (requestPath.startsWith("/node_modules/.vite/") ||
      requestPath.startsWith("/@vite/") ||
      requestPath.startsWith("/@react-refresh"));

  if (isViteDevInternal) {
    return next();
  }

  const blockedSensitivePath =
    /(^|\/)\.(env|git|svn|hg|DS_Store)(\/|$)/i.test(requestPath) ||
    /\.(env|pem|key|sqlite|db|log|bak|old|zip|tar|gz|7z|rar)$/i.test(
      requestPath,
    ) ||
    /(^|\/)(package\.json|package-lock\.json|tsconfig\.json|vite\.config\.[tj]s|server\.ts)$/i.test(
      requestPath,
    );

  if (blockedSensitivePath) {
    return res.status(404).send("Not found");
  }

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
});
app.use(express.json({ limit: "4.2mb" }));

function requireAdminExpress(req: express.Request, res: express.Response) {
  const expected = process.env.SITE_ADMIN_TOKEN;

  if (!expected || expected.length < 24) {
    res.status(500).json({
      success: false,
      error: "SITE_ADMIN_TOKEN não configurado ou muito fraco.",
    });
    return false;
  }

  const received = req.header("x-admin-token") || "";

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  const isValid =
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!isValid) {
    res.status(401).json({
      success: false,
      error: "Acesso administrativo negado.",
    });
    return false;
  }

  return true;
}

const REMOVED_DEFAULT_PROPERTY_IDS = new Set([
  "casa-parnaiba-1",
  "casa-pedrasal-2",
  "casa-coqueiro-3",
  "casa-parnaiba-4",
]);

function removeBuiltInDefaultProperties(properties: any[]) {
  if (!Array.isArray(properties)) return [];
  return properties.filter((property) => !REMOVED_DEFAULT_PROPERTY_IDS.has(property?.id));
}

const PROPERTIES_FILE = path.join(process.cwd(), "properties-data.json");

// In-memory property storage on the backend so all users can share and view created homes
let serverProperties: any[] = [];

// Helper to load properties from file
function loadPropertiesFromFile() {
  try {
    if (fs.existsSync(PROPERTIES_FILE)) {
      const data = fs.readFileSync(PROPERTIES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      const cleaned = removeBuiltInDefaultProperties(parsed);
      serverProperties = cleaned;
      if (Array.isArray(parsed) && parsed.length !== cleaned.length) {
        fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(cleaned, null, 2), "utf-8");
        console.log("Removed built-in default listings from local JSON database.");
      }
      console.log(
        `Loaded ${serverProperties.length} real properties from custom JSON file database.`,
      );
    } else {
      fs.writeFileSync(PROPERTIES_FILE, JSON.stringify([], null, 2), "utf-8");
      console.log("Created primary properties-data.json database file without fictitious listings.");
    }
  } catch (error) {
    console.error(
      "Failed to handle properties-data.json file persistence:",
      error,
    );
  }
}
loadPropertiesFromFile();

// Helper to save properties to file
function savePropertiesToFile() {
  try {
    fs.writeFileSync(
      PROPERTIES_FILE,
      JSON.stringify(removeBuiltInDefaultProperties(serverProperties), null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("Failed to write properties update to disk:", error);
  }
}

app.post("/api/admin/verify", (req, res) => {
  if (!requireAdminExpress(req, res)) return;

  res.json({
    success: true,
  });
});

// REST API core: Get all active properties
app.get("/api/properties", (_req, res) => {
  res.json(serverProperties);
});

// REST API core: Add or update a property
app.post("/api/properties", (req, res) => {
  try {
    const requestedId = typeof req.body?.id === "string" ? req.body.id : "";
    const index = requestedId
      ? serverProperties.findIndex((p) => p.id === requestedId)
      : -1;
    const existing = index !== -1 ? serverProperties[index] : undefined;

    if (existing && !requireAdminExpress(req, res)) return;

    const property = sanitizeProperty(
      {
        ...req.body,
        id: existing
          ? existing.id
          : `casa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      existing,
    );

    if (existing) {
      serverProperties[index] = property;
    } else {
      serverProperties.unshift(property);
    }

    savePropertiesToFile();

    if (existing) {
      deletePropertyImages(existing, serverProperties).then((cleanup) => {
        if (cleanup.errors.length > 0) {
          console.warn("Algumas imagens antigas não foram excluídas após editar anúncio:", cleanup.errors);
        }
      });
    }

    res.json({ success: true, property });
  } catch (error: any) {
    res
      .status(error.status || 400)
      .json({ error: error.message || "Dados inválidos." });
  }
});

// REST API core: Delete a property
app.delete("/api/properties/:id", async (req, res) => {
  if (!requireAdminExpress(req, res)) return;
  const { id } = req.params;
  const deletedProperty = serverProperties.find((p) => p.id === id);

  if (!deletedProperty) {
    return res.status(404).json({ error: "Anúncio não encontrado." });
  }

  serverProperties = serverProperties.filter((p) => p.id !== id);
  savePropertiesToFile();

  const cleanup = await deletePropertyImages(deletedProperty, serverProperties);
  if (cleanup.errors.length > 0) {
    console.warn("Algumas imagens do anúncio excluído não puderam ser removidas:", cleanup.errors);
  }

  res.json({ success: true, deletedImages: cleanup.deleted, skippedImages: cleanup.skipped });
});

// Local development image upload fallback. In Vercel production, /api/upload-image.ts uses Vercel Blob.
app.post("/api/upload-image", (req, res) => {
  try {
    const dataUrl = String(req.body?.dataUrl || "");
    const filename = String(req.body?.filename || "imagem")
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9._-]+/g, "-")
      .slice(0, 80);
    const match = dataUrl.match(
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/,
    );
    if (!match)
      return res
        .status(400)
        .json({ error: "Imagem inválida. Use JPG, PNG ou WEBP." });

    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > 3 * 1024 * 1024) {
      return res
        .status(413)
        .json({ error: "Imagem muito grande. Use até 3 MB." });
    }

    const ext =
      contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : "jpg";
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const imageId = `property-image-${crypto.randomUUID()}`;
    const finalName = `${imageId}-${filename || "imagem"}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, finalName), buffer);
    res.json({ success: true, url: `/uploads/${finalName}`, imageId });
  } catch (error: any) {
    console.error("Local upload failed:", error);
    res.status(500).json({ error: "Falha ao salvar imagem local." });
  }
});

// Stats Tracker Core: Persisted in stats-data.json
const STATS_FILE = path.join(process.cwd(), "stats-data.json");
let stats = {
  visitorCount: 1487,
  groupClicksCount: 452,
  likes: 184,
  dislikes: 12,
};

function loadStatsFromFile() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, "utf-8");
      stats = { ...stats, ...JSON.parse(data) };
      console.log("Loaded backend stats from data file:", stats);
    } else {
      fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to load stats file:", err);
  }
}
loadStatsFromFile();

function saveStatsToFile() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save stats file:", err);
  }
}

app.get("/api/visitors", (_req, res) => {
  stats.visitorCount += 1;
  saveStatsToFile();
  res.json({ count: stats.visitorCount });
});

// GET all stats
app.get("/api/stats", (_req, res) => {
  res.json(stats);
});

// POST to increment group clicks
app.post("/api/stats/click-group", (_req, res) => {
  stats.groupClicksCount += 1;
  saveStatsToFile();
  res.json(stats);
});

// POST to submit feedback likes/dislikes
app.post("/api/stats/vote", (req, res) => {
  const { type } = req.body;
  if (type === "like") {
    stats.likes += 1;
  } else if (type === "dislike") {
    stats.dislikes += 1;
  }
  saveStatsToFile();
  res.json(stats);
});

const PORT = 3000;

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API SDK initialized successfully on the backend.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
} else {
  console.warn(
    "GEMINI_API_KEY is not configured or holds placeholder. AI features will fallback to rule-based generator.",
  );
}

// REST API endpoint: Generate engaging description using Gemini AI
app.post("/api/generate-description", async (req, res) => {
  const { title, city, neighborhood, type, price, bedrooms, amenities } =
    req.body;

  const amenitiesStr =
    Array.isArray(amenities) && amenities.length > 0
      ? amenities.join(", ")
      : "padrão";

  const priceStr = price
    ? `R$ ${price} por ${type === "Temporada" ? "dia" : "mês"}`
    : "Preço a combinar";

  // Fallback template-based description in case Gemini isn't available
  const getFallbackDescription = () => {
    return `Incrível oportunidade de aluguel ${type === "Temporada" ? "por temporada" : "mensal"} em ${city}${neighborhood ? `, na região de ${neighborhood}` : ""}. Trata-se de um imóvel de destaque com o título "${title}", perfeito para quem busca conforto e ótima localização. Conta com ${bedrooms || 2} quarto(s) bem distribuídos e conta com as seguintes comodidades: ${amenitiesStr}. Valor de ${priceStr}. Entre em contato para tirar suas dúvidas e agendar uma visita!`;
  };

  if (!ai) {
    return res.json({ description: getFallbackDescription() });
  }

  try {
    const prompt = `Você é um redator publicitário de imóveis experiente no Brasil. Escreva uma descrição curta, extremamente atraente, calorosa e moderna (cerca de 50 a 100 palavras) em português brasileiro para anunciar um imóvel para aluguel. Destaque o aconchego do lar, os pontos fortes citados e suas comodidades sem repetir textualmente a mesma coisa. Seja natural e profissional.

Dados do Imóvel para inspirar:
- Título: ${title}
- Tipo de Locação: Aluguel ${type}
- Localização: ${neighborhood ? neighborhood + ", " : ""}${city}
- Preço: ${priceStr}
- Quartos: ${bedrooms || 2}
- Comodidades: ${amenitiesStr}

Gere apenas o parágrafo de descrição, sem títulos extras, introduções ou marcadores.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const generatedText = response.text?.trim();
    if (generatedText) {
      return res.json({ description: generatedText });
    } else {
      throw new Error("Empty text response from Gemini");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return res.json({ description: getFallbackDescription() });
  }
});

// REST API endpoint: Parse free-text into a structured real estate property object
app.post("/api/parse-quick-ad", async (req, res) => {
  const text = String(req.body?.text || "").trim().slice(0, 4000);

  if (!text) {
    return res.status(400).json({
      success: false,
      error: "Informe os dados do imóvel antes de usar a IA.",
    });
  }

  if (!hasGeminiKey()) {
    return res.json({
      success: true,
      data: fallbackParsedProperty(text),
      isFallback: true,
      message:
        "Cadastro organizado por análise local. Configure a chave Gemini para melhorar a precisão.",
    });
  }

  try {
    const response = await generateWithGemini({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: buildParseQuickAdPrompt(text),
      config: {
        responseMimeType: "application/json",
        responseSchema: getParseQuickAdSchema(Type),
      },
    });

    const resultText = response.text?.trim();
    if (!resultText) {
      throw new Error("Resposta vazia do Gemini.");
    }

    const finalData = sanitizeParsedAiData(parseGeminiJson(resultText));

    return res.json({
      success: true,
      data: finalData,
      isFallback: false,
      message: "Informações organizadas pela IA. Revise os campos antes de publicar.",
    });
  } catch (error) {
    console.error("Error in parse-quick-ad endpoint:", error);
    return res.json({
      success: true,
      data: fallbackParsedProperty(text),
      isFallback: true,
      message:
        "A IA não conseguiu concluir a análise. Organizamos os dados possíveis automaticamente; revise os campos antes de publicar.",
    });
  }
});

// Configure Vite middleware or Static files depending on environment
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite developer mode middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static frontend files built in dist
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static asset routing set up successfully.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Express custom server started and listening on http://localhost:${PORT}`,
    );
  });
}

setupVite().catch((err) => {
  console.error("Failed to start fully integrated Express server:", err);
});
