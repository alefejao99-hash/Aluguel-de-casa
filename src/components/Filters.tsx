import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, MapPin, Sparkles, Sliders } from 'lucide-react';
import { PropertyFilter } from '../types';
import { ALL_AMENITIES } from '../data';

interface FiltersProps {
  filters: PropertyFilter;
  onChange: (filters: PropertyFilter) => void;
  availableCities: string[];
}

const POI_OPTIONS = [
  { id: 'pedra_sal', label: '🏖️ Praia da Pedra do Sal', lat: -2.8330, lng: -41.7335 },
  { id: 'porto_barcas', label: '⚓ Porto das Barcas (Centro)', lat: -2.9160, lng: -41.7770 },
  { id: 'parnaiba_shopping', label: '🛍️ Parnaíba Shopping (Cantagalo)', lat: -2.9030, lng: -41.7580 },
  { id: 'ufpi_ufdpar', label: '🎓 Campus Universitário (UFDPar/UFPI)', lat: -2.9010, lng: -41.7450 },
  { id: 'lagoa_portinho', label: '⛵ Lagoa do Portinho (Lazer)', lat: -2.9320, lng: -41.6700 },
];

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onChange,
  availableCities,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locating, setLocating] = useState(false);

  const updateFilter = <K extends keyof PropertyFilter>(key: K, value: PropertyFilter[K]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleAmenity = (amenityId: string) => {
    const nextAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter((id) => id !== amenityId)
      : [...filters.amenities, amenityId];
    updateFilter('amenities', nextAmenities);
  };

  const handlePOIChange = (poiId: string) => {
    if (poiId === '') {
      onChange({
        ...filters,
        poi: undefined,
        poiLat: undefined,
        poiLng: undefined,
        maxDistance: '',
      });
      return;
    }

    if (poiId === 'gps_current') {
      setLocating(true);
      if (!navigator.geolocation) {
        alert('Este navegador ou dispositivo não possui suporte para Geolocalização.');
        setLocating(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange({
            ...filters,
            poi: 'gps_current',
            poiLat: position.coords.latitude,
            poiLng: position.coords.longitude,
            maxDistance: filters.maxDistance || 5, // Default to 5km
          });
          setLocating(false);
        },
        (error) => {
          console.error(error);
          alert('Não foi possível obter a sua localização atual. Verifique se deu acesso à geolocalização no navegador.');
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
      return;
    }

    const selectedPoi = POI_OPTIONS.find(p => p.id === poiId);
    if (selectedPoi) {
      onChange({
        ...filters,
        poi: poiId,
        poiLat: selectedPoi.lat,
        poiLng: selectedPoi.lng,
        maxDistance: filters.maxDistance || 5, // Default to 5km
      });
    }
  };

  const handleReset = () => {
    onChange({
      search: '',
      type: 'todos',
      city: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      amenities: [],
      poi: undefined,
      poiLat: undefined,
      poiLng: undefined,
      maxDistance: '',
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.type !== 'todos' ||
    filters.city !== '' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.minBedrooms !== '' ||
    filters.amenities.length > 0 ||
    filters.poi !== undefined;

  return (
    <div className="bg-white/80 backdrop-blur-md dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 mb-8 transition-colors duration-200">
      {/* Search and Top Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Modern Search field */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            id="filter-search-input"
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Pesquisar por título, bairro, comodidades (ex: piscina, wifi)..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold"
          />
        </div>

        {/* Action button rows */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between sm:justify-start">
          {/* Quick Selection Pills */}
          <div className="inline-flex rounded-2xl bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200/40 dark:border-slate-800/60">
            {(['todos', 'temporada', 'mensal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateFilter('type', t)}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  filters.type === t
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-250 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'temporada' ? 'Temporada' : 'Mensal'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Advanced Filters Trigger */}
            <button
              id="toggle-advanced-filters-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                showAdvanced || filters.poi || filters.amenities.length > 0 || filters.minPrice || filters.maxPrice || filters.minBedrooms
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-350 text-emerald-800 dark:text-emerald-400 ring-4 ring-emerald-500/5'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
              <span>Mais Opções</span>
            </button>

            {/* Reset Active Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-3 rounded-2xl border border-transparent text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                title="Limpar todos os filtros"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced filters expanded block */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-6">
          {/* Section: Geolocation and Point of Interest */}
          <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/15 dark:bg-emerald-950/5 flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Buscar perto de Pontos de Interesse / GPS</span>
              </label>
              
              <div className="relative">
                <select
                  value={filters.poi || ''}
                  onChange={(e) => handlePOIChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">Selecione um ponto estratégico...</option>
                  <option value="gps_current">📍 Minha Localização Atual (Usar GPS do Celular)</option>
                  {POI_OPTIONS.map((poi) => (
                    <option key={poi.id} value={poi.id}>
                      {poi.label}
                    </option>
                  ))}
                </select>

                {locating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-650 text-white rounded-lg text-[10px] font-black animate-pulse">
                    Buscando GPS...
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal font-semibold">
                Mostre apenas as casas mais próximas de praias, universidades, shoppings ou da sua posição exata no litoral.
              </p>
            </div>

            {/* Slider to adjust distance */}
            {filters.poi && (
              <div className="flex-1 flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs lg:max-w-md w-full">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-600 dark:text-slate-350">Distância Máxima:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-black shadow-2xs">
                    {filters.maxDistance ? `Até ${filters.maxDistance} km` : 'Qualquer distância'}
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={filters.maxDistance || 25}
                    onChange={(e) => updateFilter('maxDistance', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                  />
                </div>
                
                <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-extrabold leading-none uppercase">
                  <span>1 km</span>
                  <span>5 km</span>
                  <span>10 km</span>
                  <span>25 km</span>
                </div>
              </div>
            )}
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Neighborhood / Bairro select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">Bairro de Parnaíba</label>
              <select
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="">Todos os Bairros</option>
                {availableCities.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">Quantidade de Quartos</label>
              <select
                value={filters.minBedrooms}
                onChange={(e) => updateFilter('minBedrooms', e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="">Qualquer quantidade</option>
                <option value="1">1+ quarto</option>
                <option value="2">2+ quartos</option>
                <option value="3">3+ quartos</option>
                <option value="4">4+ quartos</option>
              </select>
            </div>

            {/* Price slider / inputs */}
            <div className="flex flex-col gap-2 md:col-span-2 col-span-1">
              <label className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">Faixa de Preço Ideal (R$)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-[10px] font-bold text-slate-400">Min</span>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-700 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                  />
                </div>
                <span className="text-slate-400 text-xs font-extrabold">à</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-[10px] font-bold text-slate-400">Max</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="Sem limite"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-700 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider block">Filtrar por Diferenciais do Imóvel</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map((item) => {
                const isActive = filters.amenities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleAmenity(item.id)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-650 shadow-md shadow-emerald-250 dark:shadow-none'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 text-slate-650 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
