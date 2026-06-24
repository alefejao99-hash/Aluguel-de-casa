import React, { useState } from 'react';
import { MapPin, Bed, Bath, Heart, Share2, Car, Trash2, Phone, ChevronRight } from 'lucide-react';
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
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/35 dark:hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-950/5 dark:hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full"
    >
      {/* Image Area - Aspect 4:3 for elegant real estate look */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        <img
          src={coverImage}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
        />

        {/* Image count */}
        {galleryImages.length > 1 && (
          <div className="absolute top-3 left-3 z-10 rounded-xl bg-slate-900/75 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
            <span>📷</span>
            <span>{galleryImages.length} fotos</span>
          </div>
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {/* Quick Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(property.id, e);
            }}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-white/90 dark:bg-slate-850/90 text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-md transition-all border border-slate-100/10 dark:border-slate-700/30 backdrop-blur-xs cursor-pointer"
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
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-white/90 dark:bg-slate-850/90 text-slate-450 hover:text-red-500 hover:scale-105 active:scale-95 shadow-md transition-all border border-slate-100/10 dark:border-slate-700/30 backdrop-blur-xs cursor-pointer"
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`h-4.5 w-4.5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-450 dark:text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Rent Modality & Owner Badges */}
        <div className="absolute bottom-3 left-3 flex gap-1.5 z-10 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-extrabold tracking-wider uppercase shadow-sm backdrop-blur-md bg-opacity-90 ${
              property.type === 'temporada'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {property.type === 'temporada' ? '✨ Temporada' : '📅 Mensal'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-extrabold tracking-wider uppercase shadow-sm backdrop-blur-md bg-opacity-90 ${
              property.ownerType === 'imobiliaria'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            {property.ownerType === 'imobiliaria' ? '🏢 Imobiliária' : '👤 Particular'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900">
        <div className="space-y-2.5">
          {/* Price Header */}
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-xs text-slate-450 dark:text-slate-500 font-bold">
                {property.type === 'temporada' ? '/diária' : '/mensal'}
              </span>
            </div>
            
            {/* Quick Specs inline */}
            <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-500 font-bold">
              <div className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                <span>{property.bedrooms} q</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                <span>{property.bathrooms} b</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-tight">
              {property.title}
            </h3>
          </div>

          {/* Location details */}
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-450 dark:text-slate-550" />
            <span className="truncate font-semibold">{property.neighborhood}, {property.city}</span>
          </div>

          {/* Proximity warning / label */}
          {distance !== undefined && (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/20 px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 w-fit leading-none uppercase tracking-wide">
              <span>📍</span>
              <span>a {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`} de {distanceToPoiName}</span>
            </div>
          )}

          {/* Excerpt description */}
          <p className="text-xs text-slate-450 dark:text-slate-500 line-clamp-2 font-normal leading-relaxed">
            {property.description}
          </p>

          {/* Seller Post Info Row */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200/20">
                  {property.ownerName ? property.ownerName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide leading-none">Anunciante</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate leading-none mt-1">{property.ownerName}</span>
                </div>
              </div>
              
              {/* WhatsApp Quick Action Button */}
              <a
                href={`https://wa.me/55${property.ownerPhone.replace(/\D/g, '')}?text=Olá!%20Vi%20o%20seu%20anúncio%20da%20casa%20"${encodeURIComponent(property.title)}"%20no%20Aluguel%20Casa%20Parnaíba%20e%20gostaria%20de%20saber%20mais%20informações.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Conversar no WhatsApp"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>Ver Detalhes</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>

          {onDelete && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {showCardDeleteConfirm ? (
                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-xl border border-red-100 dark:border-red-900/30">
                  <span className="text-[9px] font-bold text-red-600 dark:text-red-400 mr-1">Excluir?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(property.id);
                      setShowCardDeleteConfirm(false);
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded-lg font-bold text-[9px] hover:bg-red-700 cursor-pointer"
                  >
                    Sim
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCardDeleteConfirm(false);
                    }}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg font-bold text-[9px] hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
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
                  className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                  title="Excluir Postagem"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
