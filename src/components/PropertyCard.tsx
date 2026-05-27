import React from 'react';
import { MapPin, Bed, Bath, Maximize2, Heart, Share2 } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onFavoriteToggle: (id: string, e: React.MouseEvent) => void;
  onSelect: (property: Property) => void;
  onShare: (id: string, e: React.MouseEvent) => void;
  distance?: number;
  distanceToPoiName?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isFavorite,
  onFavoriteToggle,
  onSelect,
  onShare,
  distance,
  distanceToPoiName,
}) => {
  // Format price
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <div
      id={`property-card-${property.id}`}
      onClick={() => onSelect(property)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Property Image Container */}
      <div className="relative aspect-video sm:aspect-4/3 w-full overflow-hidden bg-slate-150 dark:bg-slate-800">
        <img
          src={property.imageUrl}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-550 ease-out"
        />

        {/* Favorite toggle and share icon overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {/* Share individual house button */}
          <button
            onClick={(e) => onShare(property.id, e)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-200 shadow-md backdrop-blur-xs transition-all pointer-events-auto border border-transparent dark:border-slate-700"
            title="Copiar link de divulgação"
          >
            <Share2 className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={(e) => onFavoriteToggle(property.id, e)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-750 text-slate-400 hover:text-red-500 shadow-md backdrop-blur-xs transition-all pointer-events-auto border border-transparent dark:border-slate-700"
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`h-4.5 w-4.5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Type Badge */}
        <div className="absolute bottom-3 left-3 flex gap-1 z-10">
          <span
            className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase shadow-md ${
              property.type === 'temporada'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {property.type === 'temporada' ? 'Temporada' : 'Aluguel Mensal'}
          </span>
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Price Tag with modern custom layout */}
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-display text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {formattedPrice}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              / {property.type === 'temporada' ? 'dia' : 'mês'}
            </span>
          </div>

          {/* Distance Tag (Geolocated) */}
          {distance !== undefined && (
            <div className="mb-2.5 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold text-emerald-800 dark:text-emerald-400 w-fit leading-none tracking-wide uppercase">
              <span>📍</span>
              <span>
                a {distance < 1 
                  ? `${Math.round(distance * 1000)}m` 
                  : `${distance.toFixed(1)} km`} de: {distanceToPoiName || 'Ponto'}
              </span>
            </div>
          )}

          {/* Location Badge */}
          <div className="flex items-center gap-1.5 text-slate-400 mb-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider truncate text-slate-500 dark:text-slate-400">
              {property.neighborhood}, {property.city} - {property.state}
            </span>
          </div>

          {/* House Title */}
          <h3 className="font-display text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
            {property.title}
          </h3>

          {/* Property Description snippet */}
          <p className="text-xs text-slate-400 dark:text-slate-400 font-normal line-clamp-2 leading-relaxed mb-4">
            {property.description}
          </p>
        </div>

        <div>
          {/* Specs / House Attributes */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600">
            {/* Bedrooms */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-50/10 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                <Bed className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{property.bedrooms}</span>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                {property.bedrooms === 1 ? 'Quarto' : 'Quartos'}
              </span>
            </div>

            {/* Bathrooms */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-50/10 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                <Bath className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{property.bathrooms}</span>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                {property.bathrooms === 1 ? 'Banheiro' : 'Banh.'}
              </span>
            </div>

            {/* Area sqm */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-50/10 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                <Maximize2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{property.area}</span>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mt-0.5">m² Úteis</span>
            </div>
          </div>

          {/* Expand Details trigger button for UI accessibility */}
          <div className="mt-3 text-center">
            <span className="inline-block text-xs font-semibold text-emerald-600 group-hover:text-emerald-700 group-hover:underline transition-colors py-1">
              Ver Detalhes e Contato &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
