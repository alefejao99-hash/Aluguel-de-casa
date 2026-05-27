import { Property } from './types';

// Imagem neutra usada apenas quando o anunciante ainda não enviou fotos reais.
// Não representa imóvel disponível para locação.
export const PLACEHOLDER_IMAGE = '/sem-foto-imovel.png';

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'casa-parnaiba-1',
    title: 'Casa Ampla no Centro Histórico',
    description: 'Excelente casa localizada na região central de Parnaíba. Próxima a comércios, bancos e farmácias. Possui 3 quartos amplos, sendo 1 suíte, sala de estar avarandada, cozinha americana, quintal espaçoso e vaga para até 2 carros. Ideal para famílias ou comércio.',
    type: 'mensal',
    price: 1500,
    city: 'Parnaíba',
    neighborhood: 'Centro',
    state: 'PI',
    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    area: 150,
    parkingSpaces: 2,
    amenities: ['ar_condicionado', 'garagem', 'jardim'],
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Ricardo Silva',
    ownerPhone: '86994123456',
    createdAt: '2026-05-20T10:00:00Z',
    address: 'Rua Conde d\'Eu',
    houseNumber: '120',
    acceptsPets: true,
    livingRooms: 1,
    kitchens: 1,
    ownerType: 'particular'
  },
  {
    id: 'casa-pedrasal-2',
    title: 'Chalé de Veraneio na Praia Pedra do Sal',
    description: 'Linda casa estilo chalé de praia a poucos metros do mar na Pedra do Sal. Cozinha equipada, ampla varanda com ganchos para redes e churrasqueira perfeita para curtir o fim de tarde na única praia de Parnaíba. Cozinha de apoio e estacionamento aberto amplo.',
    type: 'temporada',
    price: 350,
    city: 'Parnaíba',
    neighborhood: 'Pedra do Sal',
    state: 'PI',
    bedrooms: 2,
    bathrooms: 2,
    suites: 1,
    area: 95,
    parkingSpaces: 4,
    amenities: ['wifi', 'churrasqueira', 'frente_mar', 'pet_friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Marta Costa',
    ownerPhone: '86995876543',
    createdAt: '2026-05-22T14:30:00Z',
    address: 'Av. Beira Mar, KM 12',
    houseNumber: 'S/N',
    acceptsPets: true,
    livingRooms: 1,
    kitchens: 1,
    ownerType: 'particular'
  },
  {
    id: 'casa-coqueiro-3',
    title: 'Casa Luxo com Piscina Privativa no Coqueiro',
    description: 'Espetacular imóvel de alto padrão na Praia do Coqueiro. Cozinha planejada integrada com churrasqueira gourmet, piscina maravilhosa com cascata e iluminação LED, quartos climatizados com ar-condicionado. Perfeita para temporadas de kite-surf e lazer em família.',
    type: 'temporada',
    price: 750,
    city: 'Parnaíba',
    neighborhood: 'Coqueiro',
    state: 'PI',
    bedrooms: 4,
    bathrooms: 4,
    suites: 3,
    area: 220,
    parkingSpaces: 3,
    amenities: ['wifi', 'piscina', 'churrasqueira', 'ar_condicionado', 'mobiliado', 'garagem'],
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Imobiliária Litoral Norte',
    ownerPhone: '8633215544',
    createdAt: '2026-05-24T08:15:00Z',
    address: 'Rua das Conchas, quadra 11',
    houseNumber: '45',
    acceptsPets: true,
    livingRooms: 2,
    kitchens: 1,
    ownerType: 'imobiliaria'
  },
  {
    id: 'casa-parnaiba-4',
    title: 'Apartamento Mobiliado no Planalto',
    description: 'Lindo apartamento montado e pronto para morar no bairro Planalto, Parnaíba. Contém móveis planejados, geladeira, fogão, ar condicionado na suíte, Wi-Fi de alta velocidade e portão eletrônico inteligente. Condomínio residencial tranquilo e seguro.',
    type: 'mensal',
    price: 1100,
    city: 'Parnaíba',
    neighborhood: 'Planalto',
    state: 'PI',
    bedrooms: 2,
    bathrooms: 1,
    suites: 1,
    area: 68,
    parkingSpaces: 1,
    amenities: ['wifi', 'ar_condicionado', 'mobiliado', 'garagem'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Carlos Santos',
    ownerPhone: '86981122334',
    createdAt: '2026-05-25T11:00:00Z',
    address: 'Av. Pinheiro Machado',
    houseNumber: '2050',
    acceptsPets: false,
    livingRooms: 1,
    kitchens: 1,
    ownerType: 'particular'
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
    url: PLACEHOLDER_IMAGE,
    label: 'Sem foto — envie imagens reais do imóvel',
    category: 'placeholder'
  }
];
