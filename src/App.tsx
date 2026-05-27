import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  X,
  Home,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  Users,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Upload,
  Building,
  User,
  Check,
  ExternalLink,
  Cat,
  Share2,
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Property, PropertyFilter } from './types';
import { ALL_AMENITIES } from './data';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/EYcNd2i0bti4tEUQgfIY8h';

export default function App() {
  // State variables for listings
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Stats
  const [visitorCount, setVisitorCount] = useState<number>(1487);
  const [groupClicks, setGroupClicks] = useState<number>(452);
  const [likes, setLikes] = useState<number>(184);
  const [dislikes, setDislikes] = useState<number>(12);
  const [hasVoted, setHasVoted] = useState<'like' | 'dislike' | null>(null);

  // Filters State
  const [filters, setFilters] = useState<PropertyFilter>({
    search: '',
    type: 'todos',
    city: 'Parnaíba',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    amenities: [],
  });
  
  // Contact/Listing Form State
  const [formTextToParse, setFormTextToParse] = useState<string>('');
  const [parsingAi, setParsingAi] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageUploadLoading, setImageUploadLoading] = useState<boolean>(false);
  const [descriptionGenerationLoading, setDescriptionGenerationLoading] = useState<boolean>(false);

  // New property schema state
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    title: '',
    description: '',
    type: 'mensal',
    price: 1200,
    city: 'Parnaíba',
    neighborhood: '',
    state: 'PI',
    bedrooms: 2,
    bathrooms: 1,
    suites: 0,
    area: 120,
    parkingSpaces: 1,
    amenities: [],
    imageUrl: '',
    imageUrls: [],
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    address: '',
    houseNumber: '',
    showExactAddress: true,
    livingRooms: 1,
    kitchens: 1,
    acceptsPets: true,
    ownerType: 'particular',
  });

  // Reference for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial stats and data
  useEffect(() => {
    // Increment visitor count on backend and fetch stats
    fetch('/api/visitors')
      .then((res) => res.json())
      .then((data) => {
        if (data.count) setVisitorCount(data.count);
      })
      .catch((err) => console.error('Erro de visitantes:', err));

    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setGroupClicks(data.groupClicksCount || 452);
          setLikes(data.likes || 184);
          setDislikes(data.dislikes || 12);
        }
      })
      .catch((err) => console.error('Erro de estatísticas:', err));

    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Erro ao carregar anúncios:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger metrics when clicking WhatsApp Group Link
  const handleGroupClickMetric = async () => {
    try {
      const res = await fetch('/api/stats/click-group', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setGroupClicks(data.groupClicksCount);
      }
    } catch (e) {
      console.error('Erro ao salvar métrica de clique:', e);
    }
    window.open(WHATSAPP_GROUP_URL, '_blank');
  };

  // Feedback votes
  const handleFeedbackVote = async (type: 'like' | 'dislike') => {
    if (hasVoted) return;
    try {
      const res = await fetch('/api/stats/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setHasVoted(type);
      }
    } catch (e) {
      console.error('Erro ao enviar feedback:', e);
    }
  };

  // Fill structure with Gemini parsing
  const handleAiTextParsing = async () => {
    if (!formTextToParse.trim()) {
      setAiMessage({ type: 'error', text: 'Por favor, descreva ou cole o texto do imóvel antes de prosseguir.' });
      return;
    }
    setParsingAi(true);
    setAiMessage(null);
    try {
      const res = await fetch('/api/parse-quick-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formTextToParse }),
      });
      
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          const parsed = payload.data;
          
          setNewProperty((prev) => ({
            ...prev,
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            type: parsed.type || prev.type,
            price: parsed.price || prev.price,
            neighborhood: parsed.neighborhood || prev.neighborhood,
            bedrooms: parsed.bedrooms !== undefined ? parsed.bedrooms : prev.bedrooms,
            bathrooms: parsed.bathrooms !== undefined ? parsed.bathrooms : prev.bathrooms,
            suites: parsed.suites !== undefined ? parsed.suites : prev.suites,
            area: parsed.area !== undefined ? parsed.area : prev.area,
            parkingSpaces: parsed.parkingSpaces !== undefined ? parsed.parkingSpaces : prev.parkingSpaces,
            ownerName: parsed.ownerName || prev.ownerName,
            ownerPhone: parsed.ownerPhone || prev.ownerPhone,
            ownerEmail: parsed.ownerEmail || prev.ownerEmail,
            address: parsed.address || prev.address,
            houseNumber: parsed.houseNumber || prev.houseNumber,
            showExactAddress: parsed.showExactAddress !== undefined ? parsed.showExactAddress : prev.showExactAddress,
            livingRooms: parsed.livingRooms !== undefined ? parsed.livingRooms : prev.livingRooms,
            kitchens: parsed.kitchens !== undefined ? parsed.kitchens : prev.kitchens,
            acceptsPets: parsed.acceptsPets !== undefined ? parsed.acceptsPets : prev.acceptsPets,
            ownerType: parsed.ownerType || prev.ownerType,
            amenities: Array.isArray(parsed.amenities) ? parsed.amenities : prev.amenities,
          }));

          setAiMessage({
            type: payload.isFallback ? 'info' : 'success',
            text: payload.message || 'Dados estruturados com sucesso!'
          });
        }
      } else {
        throw new Error('Falha na resposta da API');
      }
    } catch (e) {
      console.error(e);
      setAiMessage({ type: 'error', text: 'Infelizmente o servidor de IA falhou. Por favor, preencha manualmente.' });
    } finally {
      setParsingAi(false);
    }
  };

  // Generate copy via description booster (Gemini)
  const handleBoostDescription = async () => {
    if (!newProperty.title) {
      setFormErrors((prev) => ({ ...prev, title: 'Defina um título básico primeiro para orientar a IA.' }));
      return;
    }
    setDescriptionGenerationLoading(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProperty.title,
          city: newProperty.city,
          neighborhood: newProperty.neighborhood || 'Centro',
          type: newProperty.type === 'mensal' ? 'Mensal' : 'Temporada',
          price: newProperty.price,
          bedrooms: newProperty.bedrooms,
          amenities: newProperty.amenities,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          setNewProperty((prev) => ({ ...prev, description: data.description }));
          setFormErrors((prev) => {
            const copy = { ...prev };
            delete copy.description;
            return copy;
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDescriptionGenerationLoading(false);
    }
  };

  // Image Upload Handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem precisa ter no máximo 3 MB.');
      return;
    }

    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64Data,
            filename: file.name,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.url) {
            setNewProperty((prev) => ({
              ...prev,
              imageUrl: resData.url,
              imageUrls: [resData.url, ...(prev.imageUrls || [])],
            }));
          }
        } else {
          alert('Houve um erro ao enviar a foto para o servidor.');
        }
      } catch (err) {
        console.error('Upload Error:', err);
        alert('Erro de conexão ao enviar imagem.');
      } finally {
        setImageUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Checkbox Amenities Changes
  const handleAmenityCheck = (id: string, checked: boolean) => {
    setNewProperty((prev) => {
      const current = prev.amenities || [];
      const updated = checked ? [...current, id] : current.filter((item) => item !== id);
      return { ...prev, amenities: updated };
    });
  };

  // Filters Amenity Toggle
  const handleFilterAmenityToggle = (id: string) => {
    setFilters((prev) => {
      const current = prev.amenities;
      const updated = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, amenities: updated };
    });
  };

  // Submit Listing Form
  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newProperty.title?.trim()) errors.title = 'Título é obrigatório.';
    if (!newProperty.ownerName?.trim()) errors.ownerName = 'Seu nome é obrigatório.';
    if (!newProperty.address?.trim()) errors.address = 'O endereço do imóvel é obrigatório.';
    if (!newProperty.houseNumber?.trim()) errors.houseNumber = 'O número da casa é obrigatório.';
    
    const rawPhone = String(newProperty.ownerPhone || '').replace(/\D/g, '');
    if (rawPhone.length < 10 || rawPhone.length > 11) {
      errors.ownerPhone = 'Informe um WhatsApp válido (DDD + número).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProperty,
          ownerPhone: rawPhone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh lists
          await fetchProperties();
          setIsCreateModalOpen(false);
          // Clean form
          setNewProperty({
            title: '',
            description: '',
            type: 'mensal',
            price: 1200,
            city: 'Parnaíba',
            neighborhood: '',
            state: 'PI',
            bedrooms: 2,
            bathrooms: 1,
            suites: 0,
            area: 120,
            parkingSpaces: 1,
            amenities: [],
            imageUrl: '',
            imageUrls: [],
            ownerName: '',
            ownerPhone: '',
            ownerEmail: '',
            address: '',
            houseNumber: '',
            showExactAddress: true,
            livingRooms: 1,
            kitchens: 1,
            acceptsPets: true,
            ownerType: 'particular',
          });
          setFormTextToParse('');
          setAiMessage(null);
          setFormErrors({});
          alert('Anúncio publicado com sucesso para toda a comunidade!');
        }
      } else {
        const errPayload = await response.json();
        alert(`Erro ao cadastrar: ${errPayload.error || 'Verifique os campos.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao salvar anúncio.');
    }
  };

  // Filter listings based on user search parameters
  const filteredProperties = properties.filter((item) => {
    // 1. Text searches title/description/neighborhood
    const matchSearch =
      !filters.search ||
      item.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.neighborhood?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.address?.toLowerCase().includes(filters.search.toLowerCase());

    // 2. Location matches
    const matchType = filters.type === 'todos' || item.type === filters.type;

    // 3. Minimum price
    const matchMinPrice = filters.minPrice === '' || item.price >= Number(filters.minPrice);

    // 4. Maximum price
    const matchMaxPrice = filters.maxPrice === '' || item.price <= Number(filters.maxPrice);

    // 5. Bedrooms
    const matchBedrooms = filters.minBedrooms === '' || item.bedrooms >= Number(filters.minBedrooms);

    // 6. Amenities matches (has all checked)
    const matchAmenities = filters.amenities.every((amenityId) =>
      item.amenities?.includes(amenityId)
    );

    return matchSearch && matchType && matchMinPrice && matchMaxPrice && matchBedrooms && matchAmenities;
  });

  // Formatting utility
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col antialiased">
      {/* Upper Navigation/Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-green-200">
              <Home size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                MURAL DE ALUGUEL
              </h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold">
                ESTILO MARKETPLACE • PI
              </span>
            </div>
          </div>

          {/* Quick Stats Banner (Centered on XL Desktop, hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Users size={14} className="text-slate-400" />
              Visitantes: <strong className="text-slate-900 font-semibold">{visitorCount}</strong>
            </span>
            <div className="w-px h-3 bg-slate-300"></div>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Sparkles size={14} className="text-green-500 fill-green-50" />
              Cliques no WhatsApp: <strong className="text-slate-900 font-semibold">{groupClicks}</strong>
            </span>
          </div>

          {/* CTA & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGroupClickMetric}
              className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition duration-150 flex items-center gap-1.5 shadow-md shadow-green-100"
              id="header-click-whatsapp-group-btn"
            >
              <Users size={16} />
              <span className="hidden xs:inline">Grupo de WhatsApp</span>
              <span className="xs:hidden">Grupo</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition duration-150 flex items-center gap-1.5 shadow-md shadow-blue-100"
              id="header-create-property-btn"
            >
              <Plus size={16} className="stroke-[2.5px]" />
              <span className="hidden sm:inline">Anunciar Imóvel</span>
              <span className="sm:hidden">Anunciar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Subbanner */}
      <section className="bg-gradient-to-r from-blue-900 via-slate-900 to-green-950 text-white py-10 px-4 text-center relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="bg-green-500/20 text-green-300 font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-green-500/30">
            Casas e Apartamentos em Parnaíba - PI
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl mt-3 tracking-tight">
            Anuncie e Encontre Imóveis de Aluguel
          </h2>
          <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            Publique grátis o seu imóvel ou ache a sua próxima moradia. Todos os contatos direcionam ao WhatsApp ou ao grupo de suporte oficial!
          </p>

          <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-xs sm:text-sm text-slate-300">
            <button
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200"
              onClick={() => handleFeedbackVote('like')}
            >
              <ThumbsUp size={14} className={hasVoted === 'like' ? 'text-green-400 fill-green-400' : ''} />
              Recomendar ({likes})
            </button>
            <button
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200"
              onClick={() => handleFeedbackVote('dislike')}
            >
              <ThumbsDown size={14} className={hasVoted === 'dislike' ? 'text-red-400 fill-red-400' : ''} />
              ({dislikes})
            </button>
            <span className="text-[10px] sm:text-xs text-slate-400">
              Votações ajudam a moderar o mural.
            </span>
          </div>
        </div>
      </section>

      {/* Core Platform Body Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-grow flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
          
          {/* Quick Search */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
            <h3 className="font-display font-bold text-sm text-slate-900 tracking-tight flex items-center justify-between">
              Como funciona o WhatsApp?
              <Info size={14} className="text-slate-400" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              As casas postadas aqui mostram o contato direto do proprietário. Além disso, nosso grupo central reúne inquilinos e corretores na mesma comunidade!
            </p>
            <button
              onClick={handleGroupClickMetric}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition border border-emerald-200"
            >
              <ExternalLink size={12} />
              Visitar Grupo Oficial
            </button>
          </div>

          {/* Desktop Filters Panel */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-slate-400" />
                Filtros do Marketplace
              </span>
              {(filters.search || filters.type !== 'todos' || filters.minPrice !== '' || filters.maxPrice !== '' || filters.minBedrooms !== '' || filters.amenities.length > 0) && (
                <button
                  onClick={() => setFilters({
                    search: '',
                    type: 'todos',
                    city: 'Parnaíba',
                    minPrice: '',
                    maxPrice: '',
                    minBedrooms: '',
                    amenities: [],
                  })}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Input Search Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Pesquisar por texto</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Piscina, casa Mobiliada..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* Contract Type Tabs */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Tipo de Contrato</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl">
                {(['todos', 'mensal', 'temporada'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilters((prev) => ({ ...prev, type: t }))}
                    className={`py-1.5 text-xs font-medium rounded-lg capitalize border border-transparent transition-all ${
                      filters.type === t
                        ? 'bg-white shadow text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t === 'todos' ? 'Todos' : t === 'mensal' ? 'Mensal' : 'Diária'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Faixa de Preço (R$)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bedrooms Options */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 font-sans">Min. Quartos</label>
              <div className="grid grid-cols-5 gap-1">
                {['', '1', '2', '3', '4+'].map((opt) => {
                  const isOptSelected =
                    (opt === '' && filters.minBedrooms === '') ||
                    (opt === '4+' && filters.minBedrooms === 4) ||
                    (opt !== '' && opt !== '4+' && filters.minBedrooms === Number(opt));
                  return (
                    <button
                      key={opt || 'any'}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          minBedrooms: opt === '' ? '' : opt === '4+' ? 4 : Number(opt),
                        }))
                      }
                      className={`py-1.5 text-xs font-medium border rounded-lg transition-all ${
                        isOptSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {opt || 'Qualq.'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amenities filters */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">Comodidades do Imóvel</label>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {ALL_AMENITIES.map((amenity) => {
                  const isChecked = filters.amenities.includes(amenity.id);
                  return (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 py-1 px-1 rounded transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFilterAmenityToggle(amenity.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>{amenity.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

        </aside>

        {/* Listings Display and Results */}
        <section className="flex-grow flex flex-col gap-4">
          
          {/* Section Banner Header */}
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                EXIBINDO ANÚNCIOS ATIVOS
              </span>
              <h3 className="font-display font-black text-slate-800 text-base">
                {filteredProperties.length === 0
                  ? 'Nenhum imóvel encontrado'
                  : filteredProperties.length === 1
                  ? '1 Imóvel Disponível'
                  : `${filteredProperties.length} Imóveis Disponíveis`}
              </h3>
            </div>

            {/* Quick status indicators */}
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Parnaíba, PI
            </div>
          </div>

          {/* Load listings */}
          {loading ? (
            <div className="h-96 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-200 shadow-sm">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium text-sm">Carregando mural de aluguel...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-6 flex flex-col items-center justify-center">
              <Home size={64} className="text-slate-300 stroke-[1.2px]" />
              <h4 className="font-display font-extrabold text-slate-800 text-lg mt-4">Nenhum anúncio correspondente</h4>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">
                Não existem propriedades cadastradas que correspondam aos filtros selecionados. Limpe os filtros ou seja o primeiro a publicar um imóvel!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition duration-150 flex items-center gap-2"
              >
                <Plus size={16} />
                Cadastrar Primeiro Imóvel
              </button>
            </div>
          ) : (
            // Facebook Marketplace-style Listings Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((prop) => {
                const ownerTypeName = prop.ownerType === 'imobiliaria' ? 'Imobiliária' : 'Particular';

                return (
                  <article
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop)}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    id={`property-card-${prop.id}`}
                  >
                    {/* Media container */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img
                        src={prop.imageUrl || '/sem-foto-imovel.png'}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/sem-foto-imovel.png';
                        }}
                      />
                      
                      {/* Price Badge */}
                      <div className="absolute left-3 bottom-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] block opacity-85 leading-none uppercase font-semibold font-sans">
                          {prop.type === 'temporada' ? 'por dia' : 'por mês'}
                        </span>
                        <strong className="text-sm font-bold tracking-tight">
                          {formatCurrency(prop.price)}
                        </strong>
                      </div>

                      {/* Owner Category Indicator Badge */}
                      <div className="absolute right-3 top-3 bg-white/95 backdrop-blur-sm shadow text-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100 flex items-center gap-1">
                        {prop.ownerType === 'imobiliaria' ? (
                          <Building size={10} className="text-blue-600" />
                        ) : (
                          <User size={10} className="text-green-600" />
                        )}
                        {ownerTypeName}
                      </div>
                    </div>

                    {/* Metadata summary & descriptions */}
                    <div className="p-4 flex flex-col gap-2.5 flex-grow">
                      <div>
                        {/* Neighborhood - City */}
                        <span className="text-[10pt] font-semibold text-slate-500 tracking-tight flex items-center gap-1 select-none">
                          <MapPin size={12} className="text-slate-400 stroke-[2px]" />
                          {prop.neighborhood || 'Centro'}, {prop.city}
                        </span>
                        {/* Title */}
                        <h4 className="font-display font-extrabold text-slate-850 text-sm mt-1 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {prop.title}
                        </h4>
                      </div>

                      {/* Key features bar */}
                      <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-slate-100 text-xs text-slate-600 text-center font-medium">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-slate-400 text-[10px] font-bold block mb-0.5 uppercase tracking-wide">QUARTOS</span>
                          <span className="text-slate-900 font-semibold">{prop.bedrooms}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center border-x border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold block mb-0.5 uppercase tracking-wide">SALAS</span>
                          <span className="text-slate-900 font-semibold">{prop.livingRooms ?? 1}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-slate-400 text-[10px] font-bold block mb-0.5 uppercase tracking-wide">COZINHAS</span>
                          <span className="text-slate-900 font-semibold">{prop.kitchens ?? 1}</span>
                        </div>
                      </div>

                      {/* Bottom row items (WhatsApp CTA redirect) */}
                      <div className="flex items-center justify-between text-xs pt-1 mt-auto">
                        <span className="text-slate-400 text-[10px] font-mono">
                          {new Date(prop.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                          Ver detalhes
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </main>

        {/* Property Immersive Detail Modal (Facebook Marketplace Detail style) */}
        {selectedProperty && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[85vh]">
              
              {/* Media visual column - Left Side */}
              <div className="md:col-span-7 bg-slate-900 relative flex items-center justify-center p-4 min-h-[300px] md:min-h-[500px]">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="absolute left-4 top-4 md:hidden bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronLeft size={20} />
                </button>

                <img
                  src={selectedProperty.imageUrl || '/sem-foto-imovel.png'}
                  alt={selectedProperty.title}
                  className="max-w-full max-h-[40vh] md:max-h-[75vh] object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/sem-foto-imovel.png';
                  }}
                />

                <div className="absolute right-4 top-4 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link do mural copiado!');
                    }}
                    className="bg-black/40 backdrop-blur-sm text-white p-2 rounded-xl hover:bg-black/60 transition"
                    title="Compartilhar"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Data & Interactive sectioncolumn - Right Side */}
              <div className="md:col-span-5 flex flex-col max-h-[50vh] md:max-h-[85vh] overflow-y-auto custom-scrollbar bg-white">
                
                {/* Header info */}
                <div className="p-6 border-b border-secondary-100 flex flex-col gap-4 relative">
                  <button
                    onClick={() => setSelectedProperty(null)}
                    className="absolute right-4 top-4 hidden md:flex text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-50 transition"
                  >
                    <X size={20} />
                  </button>

                  <div>
                    {/* Location & category */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">
                      <MapPin size={12} className="text-slate-400" />
                      {selectedProperty.neighborhood}, {selectedProperty.city} - {selectedProperty.state}
                    </div>

                    {/* Title */}
                    <h2 className="font-display font-extrabold text-2xl text-slate-900 mt-2 tracking-tight leading-tight">
                      {selectedProperty.title}
                    </h2>
                  </div>

                  {/* Price Block */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-xs block font-medium">Preço do Aluguel</span>
                      <strong className="text-2xl font-black text-slate-900 font-display">
                        {formatCurrency(selectedProperty.price)}
                      </strong>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {selectedProperty.type === 'temporada' ? 'Temporada' : 'Mensal'}
                    </span>
                  </div>
                </div>

                {/* Body Details list */}
                <div className="p-6 flex flex-col gap-6 flex-grow">
                  
                  {/* Property statistics & features cards */}
                  <div>
                    <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-3">Ficha Técnica</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2.5">
                        <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm border border-slate-150">
                          <Bed size={16} />
                        </div>
                        <div>
                          <strong className="text-xs text-slate-900 block font-semibold">{selectedProperty.bedrooms} quartos</strong>
                          <span className="text-[10px] text-slate-400 block font-normal">Sendo {selectedProperty.suites || 0} suíte(s)</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2.5">
                        <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm border border-slate-150">
                          <Maximize size={16} />
                        </div>
                        <div>
                          <strong className="text-xs text-slate-900 block font-semibold">{selectedProperty.area} m²</strong>
                          <span className="text-[10px] text-slate-400 block font-normal">Área construída</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2.5">
                        <div className="bg-white p-2 rounded-lg text-amber-600 shadow-sm border border-slate-150">
                          <Bath size={16} />
                        </div>
                        <div>
                          <strong className="text-xs text-slate-900 block font-semibold">{selectedProperty.bathrooms} banheiros</strong>
                          <span className="text-[10px] text-slate-400 block font-normal">Saneado e pronto</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2.5">
                        <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm border border-slate-150">
                          <Home size={16} />
                        </div>
                        <div>
                          <strong className="text-xs text-slate-900 block font-semibold">{selectedProperty.livingRooms ?? 1} salas / {selectedProperty.kitchens ?? 1} coz.</strong>
                          <span className="text-[10px] text-slate-400 block font-normal">Cozinha e estar</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complete exact Address Section */}
                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider">Localização do Imóvel</span>
                    <p className="text-xs text-yellow-950 font-medium leading-relaxed">
                      {selectedProperty.address} — Nº {selectedProperty.houseNumber || 'S/N'}
                    </p>
                    <span className="text-[10px] text-yellow-600">
                      Bairro: {selectedProperty.neighborhood || 'Centro'}
                    </span>
                  </div>

                  {/* Description text */}
                  <div>
                    <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-2">Descrição Completa</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl whitespace-pre-line border border-slate-100">
                      {selectedProperty.description || 'Nenhuma descrição detalhada informada.'}
                    </p>
                  </div>

                  {/* Amenities */}
                  {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                    <div>
                      <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-2.5">Conveniências e Comodidades</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProperty.amenities.map((item) => {
                          const descriptor = ALL_AMENITIES.find((a) => a.id === item);
                          return (
                            <span
                              key={item}
                              className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-slate-200"
                            >
                              {descriptor ? descriptor.label : item}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pets regulations */}
                  <div className="flex items-center gap-2 text-xs text-slate-605 font-medium pb-2 border-b border-slate-100">
                    <Cat size={14} className="text-slate-400" />
                    <span>Regra para animais de estimação: </span>
                    <strong className="text-slate-900 font-semibold">
                      {selectedProperty.acceptsPets ? 'Aceita animais' : 'Não aceita animais'}
                    </strong>
                  </div>

                  {/* Owner information card / WhatsApp Chat and Group link buttons */}
                  <div className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-3xl p-5 flex flex-col gap-4 mt-2 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold font-display text-lg shadow-sm">
                        {selectedProperty.ownerName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold font-mono tracking-widest text-slate-400 uppercase">
                          {selectedProperty.ownerType === 'imobiliaria' ? 'IMOBILIÁRIA RECOMENDADA' : 'PROPRIETÁRIO PARTICULAR'}
                        </span>
                        <h5 className="font-display font-bold text-slate-900 text-sm mt-0.5 leading-none">
                          {selectedProperty.ownerName}
                        </h5>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          WhatsApp: {selectedProperty.ownerPhone}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <a
                        href={`https://wa.me/55${selectedProperty.ownerPhone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <Phone size={14} />
                        Conversar Direto
                      </a>
                      
                      <button
                        onClick={handleGroupClickMetric}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-blue-100"
                      >
                        <Users size={14} />
                        Grupo Oficial
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* Generate / Register Property Modal (Facebook Marketplace Form template) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]">
              
              {/* Form title bar */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm tracking-tight sm:text-base leading-none">
                      Criar Novo Anúncio
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-none">Preencha o formulário para divulgar para toda a comunidade.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-200 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form wrapper */}
              <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                
                {/* 1. Quick Intelligent Input Box */}
                <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-150 rounded-2xl">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-tight">
                      <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                      Cadastrar Grátis por IA — Texto Inteligente
                    </div>
                    <span className="text-[10px] bg-indigo-200 text-indigo-850 px-2 py-0.5 rounded font-bold font-mono">SUPORTE GEMINI</span>
                  </div>
                  
                  <p className="text-[11px] text-indigo-950 mb-3 leading-relaxed">
                    Copie e cole toda a descrição do seu anúncio WhatsApp (tipo "Mais uma casa no Centro com 2 quartos, n° 230, direto da imobiliária Cora, contato 86...") e clique em Preencher. Nossa IA vai ler o texto e preencher todos os campos do formulário para você ganhar tempo!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      placeholder="Descreva seu imóvel do seu jeito ou cole o texto do WhatsApp aqui..."
                      value={formTextToParse}
                      onChange={(e) => setFormTextToParse(e.target.value)}
                      className="flex-grow p-3 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 min-h-[60px] max-h-[140px] resize-y font-sans"
                    ></textarea>

                    <button
                      type="button"
                      disabled={parsingAi}
                      onClick={handleAiTextParsing}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs px-5 py-3 transition w-full sm:w-auto flex-shrink-0 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {parsingAi ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Preencher por IA
                        </>
                      )}
                    </button>
                  </div>

                  {aiMessage && (
                    <div className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      aiMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-150' : 
                      aiMessage.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-150' : 
                      'bg-green-50 text-green-800 border border-green-150'
                    }`}>
                      <Info size={14} className="flex-shrink-0" />
                      <span>{aiMessage.text}</span>
                    </div>
                  )}
                </div>

                {/* Main Form Section */}
                <form onSubmit={handleSubmitProperty} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column Controls */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    
                    <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider hidden sm:block pb-1 border-b border-slate-100">Informações de Contrato</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Título do Anúncio *</label>
                        <input
                          type="text"
                          placeholder="Ex: Casa Duplex espaçosa"
                          value={newProperty.title}
                          onChange={(e) => {
                            setNewProperty((prev) => ({ ...prev, title: e.target.value }));
                            if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                          }}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50 ${
                            formErrors.title ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                          }`}
                        />
                        {formErrors.title && <span className="text-[10px] text-red-500 font-semibold">{formErrors.title}</span>}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Tipo de Imóvel / Locação</label>
                        <select
                          value={newProperty.type}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, type: e.target.value as 'mensal' | 'temporada' }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        >
                          <option value="mensal">Aluguel Mensal</option>
                          <option value="temporada">Aluguel Temporada / Diária</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Preço Cobrado (R$) *</label>
                        <input
                          type="number"
                          value={newProperty.price || ''}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Área total do Imóvel (m²)</label>
                        <input
                          type="number"
                          value={newProperty.area || ''}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, area: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Quartos *</label>
                        <input
                          type="number"
                          value={newProperty.bedrooms || 0}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, bedrooms: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Sendo Suítes</label>
                        <input
                          type="number"
                          value={newProperty.suites || 0}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, suites: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Salas</label>
                        <input
                          type="number"
                          value={newProperty.livingRooms || 0}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, livingRooms: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Cozinhas</label>
                        <input
                          type="number"
                          value={newProperty.kitchens || 0}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, kitchens: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Banheiros</label>
                        <input
                          type="number"
                          value={newProperty.bathrooms|| 0}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, bathrooms: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Vagas Garagem</label>
                        <input
                          type="number"
                          value={newProperty.parkingSpaces || 0}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, parkingSpaces: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider pb-1 mt-2 border-b border-slate-100">Endereço Real</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Endereço / Rua *</label>
                        <input
                          type="text"
                          placeholder="Rua Conselheiro Mafra"
                          value={newProperty.address}
                          onChange={(e) => {
                            setNewProperty((prev) => ({ ...prev, address: e.target.value }));
                            if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: '' }));
                          }}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50 ${
                            formErrors.address ? 'border-red-500' : 'border-slate-200'
                          }`}
                        />
                        {formErrors.address && <span className="text-[10px] text-red-500 font-semibold">{formErrors.address}</span>}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">N° Imóvel *</label>
                        <input
                          type="text"
                          placeholder="Ex: 140 / S/N"
                          value={newProperty.houseNumber}
                          onChange={(e) => {
                            setNewProperty((prev) => ({ ...prev, houseNumber: e.target.value }));
                            if (formErrors.houseNumber) setFormErrors((prev) => ({ ...prev, houseNumber: '' }));
                          }}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50 ${
                            formErrors.houseNumber ? 'border-red-500' : 'border-slate-200'
                          }`}
                        />
                        {formErrors.houseNumber && <span className="text-[10px] text-red-500 font-semibold">{formErrors.houseNumber}</span>}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Bairro do Aluguel</label>
                        <input
                          type="text"
                          placeholder="Centro, Coqueiros..."
                          value={newProperty.neighborhood}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, neighborhood: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Cidade</label>
                        <input
                          type="text"
                          disabled
                          value="Parnaíba"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-400 font-medium cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Estado</label>
                        <input
                          type="text"
                          disabled
                          value="PI"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-400 font-medium cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider pb-1 mt-2 border-b border-slate-100">Descrição Textual</h4>
                      <div className="flex items-center justify-between gap-2 mt-2 mb-1">
                        <label className="text-xs font-semibold text-slate-605">Conte mais sobre o imóvel</label>
                        
                        <button
                          type="button"
                          disabled={descriptionGenerationLoading}
                          onClick={handleBoostDescription}
                          className="text-[10pt] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-lg border border-blue-150 transition"
                        >
                          <Sparkles size={12} className="text-blue-500 animate-pulse" />
                          {descriptionGenerationLoading ? 'Melhorando...' : 'Melhorar texto com IA'}
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        placeholder="Insira detalhes adicionais do imóvel (ex: perto de parada de ônibus, condomínio incluso, área de lazer...)"
                        value={newProperty.description}
                        onChange={(e) => setNewProperty((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50 text-slate-850 resize-y"
                      ></textarea>
                    </div>

                  </div>

                  {/* Right Column Controls (Media Upload & Form Submission Settings) */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    
                    <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">Com veículo e Fotos</h4>

                    {/* Image Drag Upload View */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">Foto de Destaque do Imóvel</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden"
                      >
                        {newProperty.imageUrl ? (
                          <>
                            <img
                              src={newProperty.imageUrl}
                              alt="Destaque"
                              className="absolute inset-0 w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-150 text-white font-bold text-xs">
                              Clique para alterar
                            </div>
                          </>
                        ) : imageUploadLoading ? (
                          <>
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-slate-500 mt-2 font-medium">Processando arquivo...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={36} className="text-slate-350" />
                            <span className="text-xs font-semibold text-slate-700 mt-2">Clique ou arraste a imagem aqui</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">Tamanho recomendado até 3MB. Formatos JPG, PNG ou WEBP.</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Amenities list checklist */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-2">Selecione Comodidades Extras</label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 border border-slate-150 rounded-xl bg-slate-50/50">
                        {ALL_AMENITIES.map((amenity) => {
                          const isChecked = (newProperty.amenities || []).includes(amenity.id);
                          return (
                            <label
                              key={amenity.id}
                              className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-100/50 p-1.5 rounded transition"
                            >
                              <input
                                type="checkbox"
                                value={amenity.id}
                                checked={isChecked}
                                onChange={(e) => handleAmenityCheck(amenity.id, e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                              />
                              <span>{amenity.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-705 font-medium hover:text-slate-900 transition">
                        <input
                          type="checkbox"
                          checked={newProperty.acceptsPets ?? true}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, acceptsPets: e.target.checked }))}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>Aceita cachorros ou gatos de estimação?</span>
                      </label>
                    </div>

                    <h4 className="font-display font-extrabold text-xs text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 mt-2">Dados do Anunciante</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Quem é você?</label>
                        <select
                          value={newProperty.ownerType}
                          onChange={(e) => setNewProperty((prev) => ({ ...prev, ownerType: e.target.value as 'particular' | 'imobiliaria' }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        >
                          <option value="particular">Proprietário Particular</option>
                          <option value="imobiliaria">Imobiliária / Corretor</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Seu Nome *</label>
                        <input
                          type="text"
                          placeholder="Seu nome"
                          value={newProperty.ownerName}
                          onChange={(e) => {
                            setNewProperty((prev) => ({ ...prev, ownerName: e.target.value }));
                            if (formErrors.ownerName) setFormErrors((prev) => ({ ...prev, ownerName: '' }));
                          }}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50 ${
                            formErrors.ownerName ? 'border-red-500' : 'border-slate-200'
                          }`}
                        />
                        {formErrors.ownerName && <span className="text-[10px] text-red-500 font-semibold">{formErrors.ownerName}</span>}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Número de WhatsApp (DDD + Telefone) *</label>
                      <input
                        type="text"
                        placeholder="Ex: 86994101112"
                        value={newProperty.ownerPhone}
                        onChange={(e) => {
                          setNewProperty((prev) => ({ ...prev, ownerPhone: e.target.value }));
                          if (formErrors.ownerPhone) setFormErrors((prev) => ({ ...prev, ownerPhone: '' }));
                        }}
                        className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50 ${
                          formErrors.ownerPhone ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">Usado para direcionar os botões do mural.</span>
                      {formErrors.ownerPhone && <span className="text-[10px] text-red-500 font-semibold">{formErrors.ownerPhone}</span>}
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition duration-150 shadow-md shadow-blue-105 flex items-center justify-center gap-1.5"
                      >
                        <Check size={16} />
                        Publicar Anúncio Grátis
                      </button>
                    </div>

                  </div>

                </form>

              </div>

            </div>
          </div>
        )}

      </div>
    );
}
