export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'temporada' | 'mensal';
  price: number;
  city: string;
  neighborhood: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  suites: number;
  area: number;
  parkingSpaces: number;
  amenities: string[];
  imageUrl: string;
  imageUrls?: string[];
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  createdAt: string;
  address?: string;
  acceptsPets?: boolean;
  hasLivingRoom?: boolean;
  hasKitchen?: boolean;
  houseNumber?: string;
  showExactAddress?: boolean;
  livingRooms?: number;
  kitchens?: number;
  lat?: number;
  lng?: number;
  ownerType?: 'particular' | 'imobiliaria';
}

export type PropertyFilter = {
  search: string;
  type: 'todos' | 'temporada' | 'mensal';
  city: string;
  minPrice: number | '';
  maxPrice: number | '';
  minBedrooms: number | '';
  amenities: string[];
  poi?: string;
  poiLat?: number;
  poiLng?: number;
  maxDistance?: number | '';
};
