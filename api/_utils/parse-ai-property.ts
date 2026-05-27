import { sanitizeParsedAiData } from './sanitize';

const KNOWN_NEIGHBORHOODS = [
  'Bairro de Fátima',
  'Fátima',
  'Centro',
  'Planalto',
  'Pedra do Sal',
  'Praia da Pedra do Sal',
  'Dirceu Arcoverde',
  'Dirceu',
  'Piauí',
  'São Vicente de Paula',
  'Nova Parnaíba',
  'São José',
  'Reis Veloso',
  'João XXIII',
  'Catanduvas',
  'Mendonça Clark',
  'Rodoviária',
  'Ceará',
  'Ilha Grande de Santa Isabel',
  'Tabuleiro',
];

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function firstNumber(text: string, patterns: RegExp[], fallback: number) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = match[1] || match[2] || match[0];
    const n = Number(String(raw).replace(/\D/g, ''));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return fallback;
}

function extractPrice(text: string, type: 'temporada' | 'mensal') {
  const pricePatterns = [
    /r\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?|[0-9]{2,6})/i,
    /(?:valor|aluguel|di[aá]ria|mensalidade|por\s+m[eê]s|m[eê]s)\D{0,18}([0-9]{2,6})/i,
    /([0-9]{2,6})\s*(?:reais|por\s+dia|a\s+di[aá]ria|mensais|por\s+m[eê]s)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = match[1].replace(/\./g, '').replace(',', '.');
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return type === 'temporada' ? 250 : 1200;
}

function extractPhone(text: string) {
  const phoneLike = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}/g);
  if (!phoneLike?.length) return '';

  const best = phoneLike
    .map((value) => value.replace(/\D/g, ''))
    .map((value) => (value.startsWith('55') && value.length > 11 ? value.slice(2) : value))
    .find((value) => value.length >= 10 && value.length <= 11);

  return best || '';
}

function detectType(text: string): 'temporada' | 'mensal' {
  const normalized = normalizeText(text);
  const temporadaTerms = [
    'diaria',
    'temporada',
    'feriado',
    'fim de semana',
    'final de semana',
    'por dia',
    'praia',
    'reveillon',
    'carnaval',
    'ferias',
  ];

  return temporadaTerms.some((term) => normalized.includes(term)) ? 'temporada' : 'mensal';
}

function detectNeighborhood(text: string) {
  const normalized = normalizeText(text);
  const explicit = normalized.match(/bairro\s+(?:do|da|de)?\s*([a-z0-9\sãáâàéêíóôõúç.-]{2,45})/i);
  if (explicit?.[1]) {
    const candidate = explicit[1]
      .split(/[,.;\n]/)[0]
      .replace(/\b(com|tem|aluguel|valor|casa|apto|apartamento)\b.*/i, '')
      .trim();
    if (candidate.length >= 2) {
      return candidate
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
  }

  const found = KNOWN_NEIGHBORHOODS.find((name) => normalized.includes(normalizeText(name)));
  return found || 'Centro';
}

function detectAddress(text: string, neighborhood: string) {
  const lines = text
    .split(/[\n;]/)
    .map((line) => line.trim())
    .filter(Boolean);

  const addressLine = lines.find((line) =>
    /\b(rua|avenida|av\.?|travessa|tv\.?|alameda|estrada|rodovia|conjunto|residencial)\b/i.test(line),
  );

  if (addressLine) {
    return addressLine.slice(0, 160);
  }

  return `${neighborhood}, Parnaíba - PI`;
}

function detectHouseNumber(text: string) {
  const patterns = [
    /(?:n[ºo°]?|n[uú]mero)\s*[:.-]?\s*(\d+[a-z]?)/i,
    /(?:rua|avenida|av\.?|travessa|tv\.?)\s+[^,\n]+,\s*(\d+[a-z]?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }

  if (/\bs\/?n\b|sem\s+n[uú]mero/i.test(text)) return 'S/N';
  return 'S/N';
}

function detectAmenities(text: string) {
  const normalized = normalizeText(text);
  const amenities = new Set<string>();

  const checks: Array<[string, string[]]> = [
    ['wifi', ['wifi', 'wi-fi', 'internet', 'fibra']],
    ['piscina', ['piscina']],
    ['churrasqueira', ['churrasqueira', 'area gourmet', 'gourmet']],
    ['ar_condicionado', ['ar condicionado', 'ar-condicionado', 'split', 'climatizado']],
    ['mobiliado', ['mobiliado', 'mobiliada', 'moveis', 'mobília', 'cama', 'geladeira', 'fogao']],
    ['garagem', ['garagem', 'vaga', 'estacionamento', 'carro']],
    ['jardim', ['jardim', 'quintal', 'gramado', 'area externa']],
    ['pet_friendly', ['aceita pet', 'aceita pets', 'animais', 'cachorro', 'gato']],
    ['frente_mar', ['frente mar', 'frente ao mar', 'beira mar', 'pe na areia', 'pedra do sal']],
    ['banheira_hidro', ['banheira', 'hidro', 'hidromassagem']],
    ['academia', ['academia']],
  ];

  for (const [id, terms] of checks) {
    if (terms.some((term) => normalized.includes(term))) amenities.add(id);
  }

  return Array.from(amenities);
}

function hasNegativePetRule(text: string) {
  return /n[aã]o\s+(aceita|permite)\s+(pet|pets|animal|animais|cachorro|gato)/i.test(text);
}

function createTitle(type: 'temporada' | 'mensal', neighborhood: string, amenities: string[]) {
  if (amenities.includes('piscina')) return `Casa com Piscina em ${neighborhood}`.slice(0, 90);
  if (amenities.includes('frente_mar')) return `Imóvel Próximo ao Mar em ${neighborhood}`.slice(0, 90);
  if (amenities.includes('mobiliado')) return `Imóvel Mobiliado em ${neighborhood}`.slice(0, 90);
  return type === 'temporada'
    ? `Imóvel para Temporada em ${neighborhood}`.slice(0, 90)
    : `Casa para Alugar em ${neighborhood}`.slice(0, 90);
}

function createDescription(text: string, type: 'temporada' | 'mensal', neighborhood: string, amenities: string[]) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length >= 120) return clean.slice(0, 900);

  const typeLabel = type === 'temporada' ? 'locação por temporada' : 'locação mensal';
  const amenitiesText = amenities.length
    ? ` O imóvel conta com ${amenities.map((item) => item.replace(/_/g, ' ')).join(', ')}.`
    : '';

  return `Imóvel disponível para ${typeLabel} em ${neighborhood}, Parnaíba - PI.${amenitiesText} Consulte o anunciante para confirmar disponibilidade, condições de pagamento e detalhes da visita.`;
}

export function fallbackParsedProperty(text: string) {
  const type = detectType(text);
  const neighborhood = detectNeighborhood(text);
  const amenities = detectAmenities(text);
  const suites = firstNumber(text, [/(\d+)\s*su[ií]tes?/i], 0);
  const bedrooms = Math.max(
    suites || 0,
    firstNumber(text, [/(\d+)\s*(?:quartos?|dormit[oó]rios?|qts?)/i], suites > 0 ? suites : 2),
  );
  const bathrooms = Math.max(
    suites,
    firstNumber(text, [/(\d+)\s*(?:banheiros?|wcs?|wc)/i], suites > 0 ? suites : 1),
  );
  const livingRooms = firstNumber(text, [/(\d+)\s*salas?/i], /\bsala\b/i.test(text) ? 1 : 1);
  const kitchens = firstNumber(text, [/(\d+)\s*cozinhas?/i], /\bcozinha\b/i.test(text) ? 1 : 1);
  const parkingSpaces = firstNumber(text, [/(\d+)\s*(?:vagas?|garagens?)/i], amenities.includes('garagem') ? 1 : 0);
  const area = firstNumber(text, [/(\d{2,5})\s*m(?:²|2|etros?)/i], 100);
  const price = extractPrice(text, type);
  const phone = extractPhone(text);
  const address = detectAddress(text, neighborhood);
  return sanitizeParsedAiData({
    title: createTitle(type, neighborhood, amenities),
    description: createDescription(text, type, neighborhood, amenities),
    type,
    price,
    neighborhood,
    bedrooms,
    bathrooms,
    suites,
    area,
    parkingSpaces,
    ownerName: '',
    ownerPhone: phone,
    ownerEmail: '',
    address,
    houseNumber: detectHouseNumber(text),
    showExactAddress: /pode\s+mostrar\s+(?:o\s+)?endere[cç]o|mostrar\s+endere[cç]o\s+exato|endere[cç]o\s+autorizado/i.test(text),
    livingRooms,
    kitchens,
    acceptsPets: amenities.includes('pet_friendly') && !hasNegativePetRule(text),
    hasLivingRoom: livingRooms > 0,
    hasKitchen: kitchens > 0,
    ownerType: /imobili[aá]ria|corretor|creci/i.test(text) ? 'imobiliaria' : 'particular',
    amenities,
  });
}

export function buildParseQuickAdPrompt(text: string) {
  return `Atue como um assistente profissional de cadastro imobiliário para um portal de locação em Parnaíba, Piauí.

Sua tarefa é transformar o texto informado pelo anunciante em um cadastro estruturado, claro e comercialmente apresentável. O anunciante pode escrever de forma simples, incompleta ou corrida. Organize as informações sem alterar fatos importantes.

Regras obrigatórias:
1. Retorne somente JSON válido, sem markdown, sem comentários e sem texto fora do JSON.
2. Não invente telefone, e-mail, nome do proprietário, endereço exato ou número do imóvel. Se não constar no texto, use string vazia para nome/e-mail/telefone e "S/N" para número.
3. A cidade sempre deve ser Parnaíba e o estado sempre PI.
4. O campo "type" deve ser exatamente "temporada" ou "mensal". Use "temporada" para diária, fim de semana, férias, feriados ou praia; use "mensal" para moradia, contrato mensal ou aluguel fixo.
5. O campo "price" deve conter somente número inteiro, sem R$, pontos ou vírgulas. Para temporada, interprete como diária; para mensal, interprete como mensalidade.
6. O campo "title" deve ser profissional, objetivo, sem emojis, com no máximo 70 caracteres.
7. O campo "description" deve ser organizado, natural e confiável, com até 750 caracteres. Não use emojis. Não prometa informações que não estejam no texto.
8. O campo "amenities" só pode conter estes slugs: wifi, piscina, churrasqueira, ar_condicionado, mobiliado, garagem, jardim, pet_friendly, frente_mar, banheira_hidro, academia.
9. Se uma comodidade não estiver explícita ou fortemente indicada, não inclua.
10. Se uma quantidade não for informada, use um valor conservador: quartos 2, banheiros 1, suítes 0, área 100, vagas 0, salas 1, cozinhas 1.
11. "acceptsPets" deve ser true somente se o texto indicar que aceita animais/pets. Se disser que não aceita, retorne false.
12. "ownerType" deve ser "imobiliaria" quando o texto mencionar imobiliária, corretor, CRECI ou atendimento comercial; caso contrário, "particular".
13. Preserve bairro, endereço, número, telefone e preço exatamente quando forem identificáveis.
14. Se o texto mencionar IPTU, condomínio, água, energia, internet ou outras cobranças, inclua essas informações apenas na descrição, sem criar campos separados.
15. Retorne "showExactAddress" como true somente se o anunciante autorizar mostrar endereço exato; caso contrário, false.

Texto do anunciante:
"""
${text}
"""`;
}

export function getParseQuickAdSchema(Type: any) {
  return {
    type: Type.OBJECT,
    required: [
      'title',
      'description',
      'type',
      'price',
      'neighborhood',
      'bedrooms',
      'bathrooms',
      'suites',
      'area',
      'parkingSpaces',
      'ownerName',
      'ownerPhone',
      'ownerEmail',
      'address',
      'houseNumber',
      'showExactAddress',
      'livingRooms',
      'kitchens',
      'acceptsPets',
      'hasLivingRoom',
      'hasKitchen',
      'ownerType',
      'amenities',
    ],
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      type: { type: Type.STRING },
      price: { type: Type.INTEGER },
      neighborhood: { type: Type.STRING },
      bedrooms: { type: Type.INTEGER },
      bathrooms: { type: Type.INTEGER },
      suites: { type: Type.INTEGER },
      area: { type: Type.INTEGER },
      parkingSpaces: { type: Type.INTEGER },
      ownerName: { type: Type.STRING },
      ownerPhone: { type: Type.STRING },
      ownerEmail: { type: Type.STRING },
      address: { type: Type.STRING },
      houseNumber: { type: Type.STRING },
      showExactAddress: { type: Type.BOOLEAN },
      livingRooms: { type: Type.INTEGER },
      kitchens: { type: Type.INTEGER },
      acceptsPets: { type: Type.BOOLEAN },
      hasLivingRoom: { type: Type.BOOLEAN },
      hasKitchen: { type: Type.BOOLEAN },
      ownerType: { type: Type.STRING },
      amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  };
}

export function parseGeminiJson(raw: string) {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(withoutFence.slice(start, end + 1));
    }
    throw new Error('A resposta da IA não retornou JSON válido.');
  }
}
