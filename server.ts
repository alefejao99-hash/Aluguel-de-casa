import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import { DEFAULT_PROPERTIES } from './src/data';

dotenv.config();

const app = express();
app.use(express.json());

const PROPERTIES_FILE = path.join(process.cwd(), 'properties-data.json');

// In-memory property storage on the backend so all users can share and view created homes
let serverProperties = [...DEFAULT_PROPERTIES];

// Helper to load properties from file
function loadPropertiesFromFile() {
  try {
    if (fs.existsSync(PROPERTIES_FILE)) {
      const data = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
      serverProperties = JSON.parse(data);
      console.log(`Loaded ${serverProperties.length} properties from custom JSON file database.`);
    } else {
      fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(DEFAULT_PROPERTIES, null, 2), 'utf-8');
      console.log('Created primary properties-data.json database file with default listings.');
    }
  } catch (error) {
    console.error('Failed to handle properties-data.json file persistence:', error);
  }
}
loadPropertiesFromFile();

// Helper to save properties to file
function savePropertiesToFile() {
  try {
    fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(serverProperties, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write properties update to disk:', error);
  }
}

// REST API core: Get all active properties
app.get('/api/properties', (req, res) => {
  res.json(serverProperties);
});

// REST API core: Add or update a property
app.post('/api/properties', (req, res) => {
  const property = req.body;
  
  if (!property || !property.title) {
    return res.status(400).json({ error: 'Os dados do imóvel estão incompletos ou são inválidos.' });
  }

  const index = serverProperties.findIndex(p => p.id === property.id);
  if (index !== -1) {
    // Edit existing property
    serverProperties[index] = {
      ...serverProperties[index],
      ...property
    };
  } else {
    // Add new property
    if (!property.id) {
      property.id = `casa-${Date.now()}`;
    }
    if (!property.createdAt) {
      property.createdAt = new Date().toISOString();
    }
    serverProperties.unshift(property);
  }

  savePropertiesToFile();
  res.json({ success: true, property });
});

// REST API core: Delete a property
app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  serverProperties = serverProperties.filter(p => p.id !== id);
  savePropertiesToFile();
  res.json({ success: true });
});

// Stats Tracker Core: Persisted in stats-data.json
const STATS_FILE = path.join(process.cwd(), 'stats-data.json');
let stats = {
  visitorCount: 1487,
  groupClicksCount: 452,
  likes: 184,
  dislikes: 12
};

function loadStatsFromFile() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      stats = { ...stats, ...JSON.parse(data) };
      console.log('Loaded backend stats from data file:', stats);
    } else {
      fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load stats file:', err);
  }
}
loadStatsFromFile();

function saveStatsToFile() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save stats file:', err);
  }
}

app.get('/api/visitors', (req, res) => {
  stats.visitorCount += 1;
  saveStatsToFile();
  res.json({ count: stats.visitorCount });
});

// GET all stats
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// POST to increment group clicks
app.post('/api/stats/click-group', (req, res) => {
  stats.groupClicksCount += 1;
  saveStatsToFile();
  res.json(stats);
});

// POST to submit feedback likes/dislikes
app.post('/api/stats/vote', (req, res) => {
  const { type } = req.body;
  if (type === 'like') {
    stats.likes += 1;
  } else if (type === 'dislike') {
    stats.dislikes += 1;
  }
  saveStatsToFile();
  res.json(stats);
});

const PORT = 3000;

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API SDK initialized successfully on the backend.');
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.warn('GEMINI_API_KEY is not configured or holds placeholder. AI features will fallback to rule-based generator.');
}

// REST API endpoint: Generate engaging description using Gemini AI
app.post('/api/generate-description', async (req, res) => {
  const { title, city, neighborhood, type, price, bedrooms, amenities } = req.body;

  const amenitiesStr = Array.isArray(amenities) && amenities.length > 0
    ? amenities.join(', ')
    : 'padrão';

  const priceStr = price ? `R$ ${price} por ${type === 'Temporada' ? 'dia' : 'mês'}` : 'Preço a combinar';

  // Fallback template-based description in case Gemini isn't available
  const getFallbackDescription = () => {
    return `Incrível oportunidade de aluguel ${type === 'Temporada' ? 'por temporada' : 'mensal'} em ${city}${neighborhood ? `, na região de ${neighborhood}` : ''}. Trata-se de um imóvel de destaque com o título "${title}", perfeito para quem busca conforto e ótima localização. Conta com ${bedrooms || 2} quarto(s) bem distribuídos e conta com as seguintes comodidades: ${amenitiesStr}. Valor de ${priceStr}. Entre em contato para tirar suas dúvidas e agendar uma visita!`;
  };

  if (!ai) {
    return res.json({ description: getFallbackDescription() });
  }

  try {
    const prompt = `Você é um redator publicitário de imóveis experiente no Brasil. Escreva uma descrição curta, extremamente atraente, calorosa e moderna (cerca de 50 a 100 palavras) em português brasileiro para anunciar um imóvel para aluguel. Destaque o aconchego do lar, os pontos fortes citados e suas comodidades sem repetir textualmente a mesma coisa. Seja natural e profissional.

Dados do Imóvel para inspirar:
- Título: ${title}
- Tipo de Locação: Aluguel ${type}
- Localização: ${neighborhood ? neighborhood + ', ' : ''}${city}
- Preço: ${priceStr}
- Quartos: ${bedrooms || 2}
- Comodidades: ${amenitiesStr}

Gere apenas o parágrafo de descrição, sem títulos extras, introduções ou marcadores.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const generatedText = response.text?.trim();
    if (generatedText) {
      return res.json({ description: generatedText });
    } else {
      throw new Error('Empty text response from Gemini');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.json({ description: getFallbackDescription() });
  }
});

// REST API endpoint: Parse free-text into a structured real estate property object
app.post('/api/parse-quick-ad', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Texto para conversão não fornecido' });
  }

  const fallbackData = {
    title: 'Casa para Alugar em Parnaíba',
    description: text,
    type: text.toLowerCase().includes('diari') || text.toLowerCase().includes('temporad') ? 'temporada' : 'mensal',
    price: 1500,
    neighborhood: 'Centro',
    bedrooms: 2,
    bathrooms: 1,
    suites: 0,
    area: 100,
    parkingSpaces: 1,
    ownerName: 'Proprietário',
    ownerPhone: '86999999999',
    ownerEmail: '',
    amenities: ['wifi']
  };

  if (!ai) {
    return res.json({ success: true, data: fallbackData, isFallback: true });
  }

  try {
    const prompt = `Você é um robô de extração inteligente especializado no setor imobiliário de Parnaíba, Piauí, Brasil.
Dada uma mensagem de texto (que pode ser uma mensagem informal do WhatsApp ou anúncio corrido), extraia as informações estruturadas de aluguel de imóvel.

Regras importantes de preenchimento e fallbacks se não encontrar a informação explicitamente:
1. "title": Crie um título bem chamativo e profissional (no máximo 55 caracteres) com base nas informações (ex: "Casa Moderna com Piscina no Centro" ou "Duplex Compacto Aconchegante no Planalto").
2. "description": Uma descrição curta e limpa resumindo o anúncio.
3. "type": Deve ser estritamente "temporada" (se for aluguel diário, feriados, férias, temporada) ou "mensal" (se residencial fixo ou mensalidade comercial). Caso não dê para saber, padrão é "mensal".
4. "price": Apenas o número inteiro correspondente ao valor de aluguel (ex: 1500). Se não informado, use 1200 como padrão para mensal ou 250 para temporada.
5. "neighborhood": O bairro do imóvel em Parnaíba. Identifique do texto (ex: "Fátima", "Centro", "Planalto", "Pedra do Sal", "Dirceu", "Piauí", "São Vicente de Paula", "Nova Parnaíba"). Se não estiver no texto, use "Centro" como padrão.
6. "bedrooms": Inteiro de quartos. Padrão 2.
7. "bathrooms": Inteiro de banheiros. Padrão 1.
8. "suites": Inteiro de suítes. Padrão 0.
9. "area": Área em metros quadrados (m²). Padrão 100.
10. "parkingSpaces": Inteiro de vagas de garagem. Padrão 1.
11. "ownerName": Nome do proprietário ou contato. Padrão "Proprietário".
12. "ownerPhone": Telefone de contato (apenas números, ex: 86999999999). Extraia do texto. Se não achar, use "86999999999" como padrão.
13. "ownerEmail": E-mail de contato, se disponível. Padrão "" (vazio).
14. "amenities": Filtre a lista de comodidades que estão CLARAMENTE implícitas ou explícitas no texto. Apenas use os seguintes valores permitidos (retorne um array com alguns desses slugs):
    - "wifi" (se tiver internet, wifi, conexao)
    - "piscina"
    - "churrasqueira"
    - "ar_condicionado" (ar condicionado, split)
    - "mobiliado" (moveis, mobiliada, pronta pra morar, camas, tv)
    - "garagem" (garagem, vaga, estacionamento)
    - "jardim" (quintal, gramado, plantas)
    - "pet_friendly" (aceita pets, animais, cachorros, gatos)
    - "frente_mar" (frente ao mar, pe na areia, beira mar)
    Qualquer outro valor é estritamente proibido de entrar no array "amenities".

Mensagem de entrada:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['title', 'description', 'type', 'price', 'neighborhood', 'bedrooms', 'bathrooms', 'suites', 'area', 'parkingSpaces', 'ownerName', 'ownerPhone', 'ownerEmail', 'amenities'],
          properties: {
            title: { type: Type.STRING, description: 'Título atraente e curto para o imóvel de Parnaíba.' },
            description: { type: Type.STRING, description: 'Descrição textual sucinta.' },
            type: { type: Type.STRING, description: 'Estritamente "temporada" ou "mensal"' },
            price: { type: Type.INTEGER, description: 'Valor numérico do aluguel.' },
            neighborhood: { type: Type.STRING, description: 'Bairro de Parnaíba (Centro, Fátima, etc.)' },
            bedrooms: { type: Type.INTEGER, description: 'Quantidade de quartos.' },
            bathrooms: { type: Type.INTEGER, description: 'Quantidade de banheiros.' },
            suites: { type: Type.INTEGER, description: 'Quantidade de suítes.' },
            area: { type: Type.INTEGER, description: 'Área aproximada m².' },
            parkingSpaces: { type: Type.INTEGER, description: 'Vagas de garagem.' },
            ownerName: { type: Type.STRING, description: 'Nome do dono ou contato.' },
            ownerPhone: { type: Type.STRING, description: 'Telefone comercial apenas com números.' },
            ownerEmail: { type: Type.STRING, description: 'E-mail ou string vazia.' },
            amenities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Slugs permitidos: wifi, piscina, churrasqueira, ar_condicionado, mobiliado, garagem, jardim, pet_friendly, frente_mar.'
            }
          }
        }
      }
    });

    const resultText = response.text?.trim();
    if (resultText) {
      const parsedData = JSON.parse(resultText);
      // Ensure city and state fields are hardcoded for Parnaíba PI
      const finalData = {
        ...parsedData,
        city: 'Parnaíba',
        state: 'PI'
      };
      return res.json({ success: true, data: finalData, isFallback: false });
    } else {
      throw new Error('Empty response text from parser model');
    }
  } catch (error) {
    console.error('Error in parse-quick-ad endpoint:', error);
    return res.json({ success: true, data: fallbackData, isFallback: true });
  }
});

// Configure Vite middleware or Static files depending on environment
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite developer mode middleware integrated successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static frontend files built in dist
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static asset routing set up successfully.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom server started and listening on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start fully integrated Express server:', err);
});
