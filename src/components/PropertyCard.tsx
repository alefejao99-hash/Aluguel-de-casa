import React, { useState } from 'react';
import { MapPin, Bed, Bath, Heart, Share2, Car, Trash2, Phone } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onFavoriteToggle: (id: string, e: React.MouseEvent) => void;
  onSelect: (property: Property) => void;
  onShare: (id: string, e: React.MouseEvent) => void;
  distance?: number;
  distanceToPoiName?: string;
  onDelete?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isFavorite,
  onFavoriteToggle,
  onSelect,
  onShare,
  distance,
  distanceToPoiName,
  onDelete,
}) => {
  const [showCardDeleteConfirm, setShowCardDeleteConfirm] = useState(false);
  
  // Format price
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(property.price);

  const galleryImages = property.imageUrls?.length ? property.imageUrls : [property.imageUrl];
  const coverImage = galleryImages[0] || property.imageUrl;

  return (
    <div
      id={`property-card-${property.id}`}
      onClick={() => onSelect(property)}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Facebook Marketplace Product Image (Pure Square Aspect Ratio) */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        <img
          src={coverImage}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
        />

        {galleryImages.length > 1 && (
          <div className="absolute top-2.5 left-2.5 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
            📷 {galleryImages.length} fotos
          </div>
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {/* Quick Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(property.id, e);
            }}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700/50"
            title="Copiar link de divulgação"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {/* Quick Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(property.id, e);
            }}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-450 hover:text-red-500 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700/50"
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`h-4.5 w-4.5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Rent Modality & Owner Badges */}
        <div className="absolute bottom-2.5 left-2.5 flex gap-1 z-10 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-md text-[9.5px] font-black tracking-wider uppercase shadow-xs ${
              property.type === 'temporada'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {property.type === 'temporada' ? 'Temporada' : 'Mensal'}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[9.5px] font-black tracking-wider uppercase shadow-xs ${
              property.ownerType === 'imobiliaria'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-white'
            }`}
          >
            {property.ownerType === 'imobiliaria' ? '🏢 Imobiliária' : '👤 Particular'}
          </span>
        </div>
           {/* Card Content & Details */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900">
        <div>
          {/* Price Header inside Facebook style */}
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formattedPrice}
            </span>
            <span className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">
              {property.type === 'temporada' ? '/diária' : '/mensal'}
            </span>
          </div>

          {/* Quick Specs inline summary */}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}</span>
            <span className="text-slate-350 dark:text-slate-700">•</span>
            <span>{property.bathrooms} {property.bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>
            {property.parkingSpaces > 0 && (
              <>
                <span className="text-slate-350 dark:text-slate-700">•</span>
                <span>Vaga</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 mt-1 leading-tight">
            {property.title}
          </h3>

          {/* Bairro & City (Facebook style location lines) */}
          <div className="flex items-center gap-1 text-[11.5px] text-slate-500 dark:text-slate-405 mt-1 leading-none">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{property.neighborhood}, {property.city}</span>
          </div>

          {/* Distance Proximity indicators */}
          {distance !== undefined && (
            <div className="mt-1.5 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/30 px-2 py-0.5 rounded-md text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 w-fit leading-none uppercase">
              <span>📍</span>
              <span>a {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`} de {distanceToPoiName}</span>
            </div>
          )}

          {/* Quick excerpt description */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 font-normal leading-normal mt-2">
            {property.description}
          </p>

          {/* Facebook-style Seller Post Meta row representing the Announcer profile */}
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 p-2 rounded-xl text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/10">
                  {property.ownerName ? property.ownerName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-slate-400 dark:text-slate-505 font-extrabold uppercase tracking-wide leading-none">Vendedor</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 truncate leading-none mt-0.5">{property.ownerName}</span>
                </div>
              </div>
              
              {/* Quick Messenger Action */}
              <a
                href={`https://wa.me/55${property.ownerPhone.replace(/\D/g, '')}?text=Olá,%20vi%20o%20seu%20anúncio%20da%20casa%2520"${encodeURIComponent(property.title)}"%20no%2520Aluguel%2520Casa%2520Parnaíba%2520e%252520gostaria%252520de%252520conversar%252520sobre%252520a%252520locação!`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-650 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent"
                title="Perguntar sobre a disponibilidade"
              >
                <Phone className="h-3 w-3 shrink-0" />
                             </a>
            </div>
          </div>
        </div>        </div>

        {/* Facebook-style Actions Footer Row */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
          <button
            onClick={() => onSelect(property)}
            className="text-[11.5px] font-black text-emerald-600 dark:text-emerald-450 hover:underline flex items-center gap-1"
          >
            <span>Ver Detalhes</span>
            <span>&rarr;</span>
          </button>

          {onDelete && (
            <>
              {showCardDeleteConfirm ? (
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-lg border border-red-100 dark:border-red-900/40">
                  <span className="text-[9px] font-bold text-red-600 dark:text-red-400">Excluir?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(property.id);
                      setShowCardDeleteConfirm(false);
                    }}
                    className="px-1.5 py-0.5 bg-red-600 text-white rounded font-bold text-[8.5px]"
                  >
                    Sim
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCardDeleteConfirm(false);
                    }}
                    className="px-1.5 py-0.5 bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold text-[8.5px]"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCardDeleteConfirm(true);
                  }}
                  className="text-[10px] text-red-500 hover:text-red-650 font-bold flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
                  title="Excluir Postagem"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Excluir</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
