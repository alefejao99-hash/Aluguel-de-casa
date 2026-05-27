import React, { useState } from 'react';
import { Search, SlidersHorizontal, Sliders, X, Sparkles, Filter, MapPin, Navigation } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs p-5 md:p-6 mb-8 transition-colors duration-200">
      {/* Prime Search Line */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Search input field */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            id="filter-search-input"
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Pesquisar por título, bairro ou comodidades..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-700 dark:text-slate-150 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          {/* Quick Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-955 p-1 divide-x divide-transparent">
            {(['todos', 'temporada', 'mensal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateFilter('type', t)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  filters.type === t
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'temporada' ? 'Temporada' : 'Mensal'}
              </button>
            ))}
          </div>

          {/* Collapsible toggle */}
          <button
            id="toggle-advanced-filters-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showAdvanced || filters.poi || filters.amenities.length > 0 || filters.minPrice || filters.maxPrice || filters.minBedrooms
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-950/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtros {filters.poi ? '• Geográfico' : ''}</span>
          </button>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-transparent text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-300 transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters collapsible block */}
      {showAdvanced && (
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-fadeIn">
          
          {/* SECTOR: Geolocation proximity search */}
          <div className="md:col-span-2 lg:col-span-4 p-4 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800/60 bg-emerald-55/15 dark:bg-emerald-955/10 flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Busca por Geolocalização / Proximidade</span>
              </label>
              
              <div className="flex gap-2 relative">
                <select
                  value={filters.poi || ''}
                  onChange={(e) => handlePOIChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">Nenhum ponto selecionado</option>
                  <option value="gps_current">📍 Usar Minha Localização Atual (GPS)</option>
                  {POI_OPTIONS.map((poi) => (
                    <option key={poi.id} value={poi.id}>
                      {poi.label}
                    </option>
                  ))}
                </select>

                {locating && (
                  <div className="flex items-center justify-center px-4 bg-emerald-600 text-white rounded-xl text-xs font-semibold animate-pulse absolute right-1 top-1 bottom-1">
                    Obtendo coordenadas...
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                Selecione um ponto turístico, universidade ou use o GPS do seu dispositivo para encontrar imóveis arredores de Parnaíba.
              </p>
            </div>

            {filters.poi && (
              <div className="flex-1 flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Mostrar imóveis num raio de:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    {filters.maxDistance ? `Até ${filters.maxDistance} km` : 'Qualquer distância'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={filters.maxDistance || 25}
                    onChange={(e) => updateFilter('maxDistance', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                  />
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                  <span>1 km</span>
                  <span>5 km</span>
                  <span>10 km</span>
                  <span>25 km</span>
                </div>
              </div>
            )}
          </div>

          {/* Bairro Select */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bairro de Parnaíba</label>
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Todos os Bairros</option>
              {availableCities.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mínimo de Quartos</label>
            <select
              value={filters.minBedrooms}
              onChange={(e) => updateFilter('minBedrooms', e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Qualquer quantidade</option>
              <option value="1">1+ quartos</option>
              <option value="2">2+ quartos</option>
              <option value="3">3+ quartos</option>
              <option value="4">4+ quartos</option>
            </select>
          </div>

          {/* Min & Max Price Fields */}
          <div className="flex flex-col gap-2 md:col-span-2 col-span-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faixa de Preço (R$)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="Mínimo"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-250 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="Máximo"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-250 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Amenities Checklist */}
          <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comodidades desejadas</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map((item) => {
                const isActive = filters.amenities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleAmenity(item.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-650 text-white border-emerald-650 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
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
