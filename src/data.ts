import { Property } from './types';

// Constants pointing to public realistic generated local house images
export const imgCasaPiscina = '/images/casa_piscina_real_1779799405058.png';
export const imgChalePraia = '/images/chale_praia_real_1779799421284.png';
export const imgMansaoPraia = '/images/mansao_praia_real_1779799455102.png';
export const imgDuplexModerno = '/images/duplex_moderno_real_1779799437482.png';

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'casa-parnaiba-1',
    title: 'Casa Espaçosa com Piscina no Bairro de Fátima',
    description: 'Excelente casa residencial de alto padrão no Bairro de Fátima, Parnaíba - PI. Conta com área de lazer privativa completa, churrasqueira nova com bancada de granito, piscina refrescante, garagem coberta para 3 carros, portão eletrônico e cerca elétrica. Ideal para famílias ou grupos que visitam o litoral do Piauí.',
    type: 'mensal',
    price: 2800, // Monthly rate
    city: 'Parnaíba',
    neighborhood: 'Bairro de Fátima',
    state: 'PI',
    bedrooms: 3,
    bathrooms: 3,
    suites: 2,
    area: 180,
    parkingSpaces: 3,
    amenities: ['wifi', 'piscina', 'churrasqueira', 'ar_condicionado', 'mobiliado', 'garagem', 'jardim'],
    imageUrl: imgCasaPiscina,
    ownerName: 'Manoel Rodrigues',
    ownerPhone: '86994553311',
    ownerEmail: 'manoel.phb@gmail.com',
    createdAt: '2026-05-20T10:00:00Z',
    address: 'Rua Pires Rebelo, 1420 - Bairro de Fátima',
    acceptsPets: true,
    hasLivingRoom: true,
    hasKitchen: true,
    lat: -2.9120,
    lng: -41.7650,
    ownerType: 'particular'
  },
  {
    id: 'casa-pedrasal-2',
    title: 'Chalé Brisa da Pedra do Sal - Beira Mar',
    description: 'Desfrute do visual deslumbrante e do pôr do sol único na Praia da Pedra do Sal em Parnaíba. Nosso chalé oferece varanda ampla com armadores de rede com excelente ventilação natural, cozinha americana equipada, área gourmet com churrasqueira e vaga protegida para carros. Perfeito para kiters e amantes de praia.',
    type: 'temporada',
    price: 350, // Daily rate
    city: 'Parnaíba',
    neighborhood: 'Praia da Pedra do Sal',
    state: 'PI',
    bedrooms: 2,
    bathrooms: 2,
    suites: 1,
    area: 110,
    parkingSpaces: 2,
    amenities: ['wifi', 'churrasqueira', 'mobiliado', 'garagem', 'pet_friendly', 'frente_mar'],
    imageUrl: imgChalePraia,
    ownerName: 'Clara Sousa Teles',
    ownerPhone: '86981122334',
    ownerEmail: 'clara.teles@yahoo.com.br',
    createdAt: '2026-05-22T08:00:00Z',
    address: 'Av. Beira Mar, S/N - Praia da Pedra do Sal',
    acceptsPets: true,
    hasLivingRoom: true,
    hasKitchen: true,
    lat: -2.8330,
    lng: -41.7335,
    ownerType: 'particular'
  },
  {
    id: 'casa-coqueiro-3',
    title: 'Mansão de Praia Luxuosa na Pedra do Sal',
    description: 'Espetacular mansão de temporada na Praia da Pedra do Sal em Parnaíba - PI. Ampla área externa, piscina com cascata, churrasqueira, varanda gourmet integrada, 4 suítes com ar-condicionado e camas super confortáveis. Fica a apenas 2 minutos de caminhada da melhor faixa de areia da praia mais famosa de Parnaíba.',
    type: 'temporada',
    price: 900, // Daily rate
    city: 'Parnaíba',
    neighborhood: 'Praia da Pedra do Sal',
    state: 'PI',
    bedrooms: 4,
    bathrooms: 5,
    suites: 4,
    area: 350,
    parkingSpaces: 4,
    amenities: ['wifi', 'piscina', 'churrasqueira', 'ar_condicionado', 'mobiliado', 'garagem', 'pet_friendly', 'jardim'],
    imageUrl: imgMansaoPraia,
    ownerName: 'José Ribamar Silva',
    ownerPhone: '86999811252',
    ownerEmail: 'ribas.temporada@gmail.com',
    createdAt: '2026-05-24T12:00:00Z',
    address: 'Rua dos Coqueiros, 25 - Praia da Pedra do Sal',
    acceptsPets: true,
    hasLivingRoom: true,
    hasKitchen: true,
    lat: -2.8350,
    lng: -41.7342,
    ownerType: 'imobiliaria'
  },
  {
    id: 'casa-parnaiba-4',
    title: 'Apartamento Duplex Mobiliado no Planalto',
    description: 'Excelente duplex muito seguro com cerca elétrica no bairro Planalto, ideal para moradia mensal. Próximo a supermercados, farmácias e à faculdade de medicina. Cozinha compacta completa, quartos com ventilador de teto e ar-condicionado, máquina de lavar e excelente Wi-Fi para home office.',
    type: 'mensal',
    price: 1500, // Monthly rate
    city: 'Parnaíba',
    neighborhood: 'Planalto',
    state: 'PI',
    bedrooms: 2,
    bathrooms: 2,
    suites: 1,
    area: 85,
    parkingSpaces: 1,
    amenities: ['wifi', 'ar_condicionado', 'mobiliado', 'garagem'],
    imageUrl: imgDuplexModerno,
    ownerName: 'Fernanda Lira',
    ownerPhone: '86981144556',
    ownerEmail: 'fernanda.lira@outlook.com',
    createdAt: '2026-05-24T14:30:00Z',
    address: 'Rua Dr. João Silva, 340 - Planalto',
    acceptsPets: false,
    hasLivingRoom: true,
    hasKitchen: true,
    lat: -2.9050,
    lng: -41.7350,
    ownerType: 'imobiliaria'
  }
];

export const ALL_AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', category: 'Conectividade' },
  { id: 'piscina', label: 'Piscina', category: 'Lazer' },
  { id: 'churrasqueira', label: 'Churrasqueira', category: 'Lazer' },
  { id: 'ar_condicionado', label: 'Ar Condicionado', category: 'Conforto' },
  { id: 'mobiliado', label: 'Mobiliado', category: 'Praticidade' },
  { id: 'garagem', label: 'Vaga de Garagem', category: 'Praticidade' },
  { id: 'pet_friendly', label: 'Aceita Pets', category: 'Regras' },
  { id: 'frente_mar', label: 'Frente ao Mar', category: 'Localização' },
  { id: 'banheira_hidro', label: 'Banheira/Hidro', category: 'Conforto' },
  { id: 'academia', label: 'Academia no Condomínio', category: 'Lazer' },
  { id: 'jardim', label: 'Quintal / Jardim', category: 'Espaço' }
];

export const STATES_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const POPULAR_IMAGES = [
  {
    url: imgCasaPiscina,
    label: 'Casa com Piscina Realista',
    category: 'moderna'
  },
  {
    url: imgChalePraia,
    label: 'Chalé Brisa da Praia do Sal',
    category: 'serra'
  },
  {
    url: imgMansaoPraia,
    label: 'Mansão de Praia Luxuosa',
    category: 'luxo'
  },
  {
    url: imgDuplexModerno,
    label: 'Apartamento Duplex Urban',
    category: 'apartamento'
  },
  {
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    label: 'Fachada Villa Conjugada Elegante',
    category: 'luxo'
  },
  {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
    label: 'Sala Decorada Clean',
    category: 'interior'
  },
  {
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800',
    label: 'Apartamento Loft Contemporâneo',
    category: 'apartamento'
  }
];
