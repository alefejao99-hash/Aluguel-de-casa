import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, X, ShieldAlert, Sparkles, Filter, Smile,
  Home, Clipboard, Heart, Share2, Info, ArrowRight, RotateCcw
} from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Property, PropertyFilter } from './types';
import { DEFAULT_PROPERTIES } from './data';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetails } from './components/PropertyDetails';
import { PropertyForm } from './components/PropertyForm';

// --- Haversine formula to compute distance in kilometers between two GPS coordinate pairs ---
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export default function App() {
  // --- States ---
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<PropertyFilter>({
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // --- Dark Mode Theme State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('divulga_casas_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('divulga_casas_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- Initialize states from backend and localStorage ---
  useEffect(() => {
    const fetchServerProperties = async () => {
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProperties(data);
            localStorage.setItem('divulga_casas_properties', JSON.stringify(data));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch from server properties API, using local fallback:', err);
      }

      // Local fallback
      const storedProperties = localStorage.getItem('divulga_casas_properties');
      if (storedProperties) {
        try {
          setProperties(JSON.parse(storedProperties));
        } catch (e) {
          setProperties(DEFAULT_PROPERTIES);
        }
      } else {
        setProperties(DEFAULT_PROPERTIES);
        localStorage.setItem('divulga_casas_properties', JSON.stringify(DEFAULT_PROPERTIES));
      }
    };

    fetchServerProperties();

    const storedFavorites = localStorage.getItem('divulga_casas_favorites');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        setFavorites([]);
      }
    }
  }, []);

  // --- Handle deep linking on load (?casa=PROPERTY_ID) ---
  useEffect(() => {
    if (properties.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const casaId = params.get('casa');
    if (casaId) {
      const found = properties.find(p => p.id === casaId);
      if (found) {
        setSelectedProperty(found);
        showToast('Localizamos o imóvel do link compartilhado!', 'info');
      }
    }
  }, [properties]);

  // --- Persist states ---
  const saveFavorites = (updated: string[]) => {
    setFavorites(updated);
    localStorage.setItem('divulga_casas_favorites', JSON.stringify(updated));
  };

  // --- Helpers ---
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFavoriteToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
      showToast('Imóvel removido dos seus favoritos!', 'info');
    } else {
      updated = [...favorites, id];
      showToast('Imóvel adicionado aos seus favoritos! ❤️', 'success');
    }
    saveFavorites(updated);
  };

  const handleShareProperty = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?casa=${id}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Link de divulgação copiado para a área de transferência! 🚀', 'success');
  };

  const handleAddOrEditProperty = async (formData: Omit<Property, 'id' | 'createdAt'> & { id?: string }) => {
    let finalProperty: Property;

    if (formData.id) {
      // Editing existing property
      finalProperty = {
        ...properties.find(p => p.id === formData.id),
        ...formData,
      } as Property;
    } else {
      // Registering new property
      finalProperty = {
        ...formData,
        id: `casa-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Property;
    }

    // Save locally immediately for fast feedback
    let updated: Property[];
    if (formData.id) {
      updated = properties.map(p => p.id === formData.id ? finalProperty : p);
    } else {
      updated = [finalProperty, ...properties];
    }
    setProperties(updated);
    localStorage.setItem('divulga_casas_properties', JSON.stringify(updated));

    // Save on backend server
    try {
      const resp = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProperty)
      });
      if (resp.ok) {
        const apiRes = await resp.json();
        if (apiRes.success && apiRes.property) {
          console.log('Saved property successfully on the server:', apiRes.property);
        }
      }
    } catch (err) {
      console.error('Error saving property to backend:', err);
    }

    if (formData.id) {
      showToast('Anúncio atualizado com sucesso!', 'success');
      if (selectedProperty && selectedProperty.id === formData.id) {
        setSelectedProperty(finalProperty);
      }
    } else {
      showToast('Parabéns! Seu imóvel foi anunciado e já está pronto para divulgação. 🏠🎉', 'success');
    }

    setIsFormOpen(false);
    setEditingProperty(null);
  };

  const handleDeleteProperty = async (id: string) => {
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    localStorage.setItem('divulga_casas_properties', JSON.stringify(updated));
    
    // Remove from favorites if it was there
    if (favorites.includes(id)) {
      saveFavorites(favorites.filter(favId => favId !== id));
    }

    setSelectedProperty(null);
    showToast('Anúncio excluído permanentemente.', 'error');

    // Delete on backend server
    try {
      await fetch(`/api/properties/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting property from backend server:', err);
    }
  };

  // --- Neighborhoods selection helping array ---
  const availableCities = Array.from(new Set(properties.map(p => p.neighborhood))).sort();

  // --- Helper to match POI display label ---
  const getPoiLabel = (poiId?: string) => {
    if (!poiId) return '';
    if (poiId === 'gps_current') return 'Sua Localização';
    const poiNames: Record<string, string> = {
      pedra_sal: 'Praia da Pedra do Sal',
      porto_barcas: 'Porto das Barcas',
      parnaiba_shopping: 'Parnaíba Shopping',
      ufpi_ufdpar: 'Campus Universitário',
      lagoa_portinho: 'Lagoa do Portinho'
    };
    return poiNames[poiId] || '';
  };

  // --- Filtering and Geolocation calculations ---
  const computedProperties = properties.map(p => {
    if (filters.poi && filters.poiLat !== undefined && filters.poiLng !== undefined && p.lat !== undefined && p.lng !== undefined) {
      const distance = getHaversineDistance(filters.poiLat, filters.poiLng, p.lat, p.lng);
      return { ...p, distance };
    }
    return p;
  });

  const filteredProperties = computedProperties.filter(p => {
    // 1. Wishlist Filter
    if (showFavoritesOnly && !favorites.includes(p.id)) {
      return false;
    }

    // 2. Type Filter (Temporada vs Mensal)
    if (filters.type !== 'todos' && p.type !== filters.type) {
      return false;
    }

    // 3. Search text (Title, description, neighborhood, city)
    const searchLower = filters.search.toLowerCase().trim();
    if (searchLower) {
      const matchTitle = p.title.toLowerCase().includes(searchLower);
      const matchDesc = p.description.toLowerCase().includes(searchLower);
      const matchNeigh = p.neighborhood.toLowerCase().includes(searchLower);
      const matchCity = p.city.toLowerCase().includes(searchLower);
      if (!matchTitle && !matchDesc && !matchNeigh && !matchCity) {
        return false;
      }
    }

    // 4. Neighborhood Select
    if (filters.city && p.neighborhood !== filters.city) {
      return false;
    }

    // 5. Min Bedrooms
    if (filters.minBedrooms !== '' && p.bedrooms < Number(filters.minBedrooms)) {
      return false;
    }

    // 6. Prices limits
    if (filters.minPrice !== '' && p.price < Number(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice !== '' && p.price > Number(filters.maxPrice)) {
      return false;
    }

    // 7. Amenities Checklist
    if (filters.amenities.length > 0) {
      const hasAll = filters.amenities.every(amenityId => p.amenities.includes(amenityId));
      if (!hasAll) {
        return false;
      }
    }

    // 8. Distance limit check
    if (filters.poi && filters.maxDistance !== '') {
      const dist = (p as any).distance;
      if (dist === undefined) {
        return false; 
      }
      if (dist > Number(filters.maxDistance)) {
        return false;
      }
    }

    return true;
  });

  // Sort by nearest if geolocation filter / Point of Interest is active
  if (filters.poi) {
    filteredProperties.sort((a, b) => {
      const distA = (a as any).distance ?? 99999;
      const distB = (b as any).distance ?? 99999;
      return distA - distB;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-60 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border font-semibold text-xs whitespace-nowrap tracking-wide leading-none ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : toastMessage.type === 'error'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-indigo-600 border-indigo-500 text-white'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 hover:opacity-80 p-0.5 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header component */}
      <Header
        onAddClick={() => setIsFormOpen(true)}
        favoritesCount={favorites.length}
        onFavoritesClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        showFavoritesOnly={showFavoritesOnly}
        totalProperties={properties.length}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Main Core Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero visual banner section */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl p-6 sm:p-10 lg:p-12 mb-2">
          {/* Subtle background overlay (Parnaíba/Beach vibes) */}
          <div className="absolute inset-0 bg-cover bg-center opacity-25 [background-image:url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200')] bg-no-repeat"></div>
          <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-900 to-transparent"></div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/35 rounded-full text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              <Sparkles className="h-3 w-3 text-emerald-400 animate-spin" />
              <span>Grupo Oficial de Divulgação - Parnaíba / PI</span>
            </span>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              🏠 ALUGUEL DE CASA <span className="text-emerald-400 block sm:inline">PARNAÍBA PI DIVULGAÇÃO</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-semibold">
              O seu portal 100% gratuito para encontrar ou anunciar casas de temporada e locação mensal em Parnaíba e região. Cadastre o seu imóvel em poucos segundos e compartilhe diretamente no nosso grupo de divulgação do WhatsApp!
            </p>

            <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-3">
              <button
                id="hero-primary-cta"
                onClick={() => setIsFormOpen(true)}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-650 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/20"
              >
                <span>Cadastrar Meu Imóvel Grátis 🏠</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <a
                href="https://chat.whatsapp.com/EYcNd2i0bti4tEUQgfIY8h"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white text-emerald-400 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <span>Entrar no Grupo de WhatsApp 💬</span>
              </a>
            </div>
          </div>
        </section>

        {/* Filter Bar Component */}
        <section>
          <Filters
            filters={filters}
            onChange={setFilters}
            availableCities={availableCities}
          />
        </section>

        {/* Property Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold text-slate-800 flex items-center gap-2">
              {showFavoritesOnly ? 'Sua Lista de Favoritos' : 'Casas Disponíveis para Locação'}
              <span className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-slate-500 font-bold rounded-lg ml-1">
                {filteredProperties.length} encontrados
              </span>
            </h2>

            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="text-xs text-emerald-600 hover:underline font-bold"
              >
                Ver todos os anúncios &rarr;
              </button>
            )}
          </div>

          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={favorites.includes(property.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onSelect={setSelectedProperty}
                  onShare={handleShareProperty}
                  distance={(property as any).distance}
                  distanceToPoiName={getPoiLabel(filters.poi)}
                />
              ))}
            </div>
          ) : (
            // Empty State
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="h-16 w-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                <Home className="h-8 w-8 text-slate-400" />
              </div>

              <div>
                <h3 className="font-display text-base font-extrabold text-slate-700">Nenhum imóvel localizado</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Não encontramos anúncios correspondentes aos filtros selecionados. Tente ajustar os parâmetros.
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setFilters({
                      search: '',
                      type: 'todos',
                      city: '',
                      minPrice: '',
                      maxPrice: '',
                      minBedrooms: '',
                      amenities: [],
                    });
                    setShowFavoritesOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Redefinir Filtros</span>
                </button>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Anunciar Casa</span>
                </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Slide / Overlay Panel modals */}
      <AnimatePresence>
        {/* Property DETAILS panel overlays */}
        {selectedProperty && (
          <PropertyDetails
            property={selectedProperty}
            isFavorite={favorites.includes(selectedProperty.id)}
            onFavoriteToggle={handleFavoriteToggle}
            onClose={() => {
              setSelectedProperty(null);
              // Clean URL query parameter if user closed property detail view
              window.history.replaceState({}, '', window.location.pathname);
            }}
            onEdit={(property) => {
              setEditingProperty(property);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteProperty}
          />
        )}

        {/* Property REGISTRATION / EDITING form overlays */}
        {isFormOpen && (
          <PropertyForm
            initialProperty={editingProperty}
            onClose={() => {
              setIsFormOpen(false);
              setEditingProperty(null);
            }}
            onSubmit={handleAddOrEditProperty}
          />
        )}
      </AnimatePresence>

      {/* Sticky footer info */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="font-display text-lg font-black text-white tracking-tight">
                Aluguel Casa <span className="text-emerald-400">Parnaíba PI</span>
              </span>
              <p className="text-xs text-slate-400 max-w-md">
                Plataforma oficial de utilidade pública para divulgação rápida de casas para temporada e locação em Parnaíba e região do litoral do Piauí. Conectado diretamente ao grupo do WhatsApp.
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 flex-wrap justify-center">
              <a
                href="https://chat.whatsapp.com/EYcNd2i0bti4tEUQgfIY8h"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-350 transition-all font-bold underline mr-1"
              >
                Entrar no Grupo de WhatsApp 💬
              </a>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">Aluguel Casa Parnaíba PI &copy; 2026</span>
            </div>
          </div>
        </div>
      </footer>

      <SpeedInsights />
    </div>
  );
}
