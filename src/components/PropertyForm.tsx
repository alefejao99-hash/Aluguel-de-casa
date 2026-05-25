import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ChevronDown, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { Property } from '../types';
import { ALL_AMENITIES, STATES_BR, POPULAR_IMAGES } from '../data';

interface PropertyFormProps {
  onClose: () => void;
  onSubmit: (property: Omit<Property, 'id' | 'createdAt'> & { id?: string }) => void;
  initialProperty?: Property | null;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  onClose,
  onSubmit,
  initialProperty,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'temporada' | 'mensal'>('temporada');
  const [price, setPrice] = useState<number | ''>('');
  const [city, setCity] = useState('Parnaíba');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('PI');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [suites, setSuites] = useState<number>(0);
  const [area, setArea] = useState<number | ''>('');
  const [parkingSpaces, setParkingSpaces] = useState<number>(1);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState(POPULAR_IMAGES[0].url);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerType, setOwnerType] = useState<'particular' | 'imobiliaria'>('particular');
  const [uploadFileName, setUploadFileName] = useState('');
  
  // Simplified fields requested by the user
  const [address, setAddress] = useState('');
  const [acceptsPets, setAcceptsPets] = useState<boolean>(true);
  const [hasLivingRoom, setHasLivingRoom] = useState<boolean>(true);
  const [hasKitchen, setHasKitchen] = useState<boolean>(true);

  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [quickAdText, setQuickAdText] = useState('');
  const [isParsingQuickAd, setIsParsingQuickAd] = useState(false);

  const handleParseQuickAd = async () => {
    if (!quickAdText.trim()) return;
    setIsParsingQuickAd(true);
    setAiError('');

    try {
      const response = await fetch('/api/parse-quick-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: quickAdText }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar texto com IA.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        setTitle(d.title || '');
        setDescription(d.description || '');
        setType(d.type || 'temporada');
        setPrice(d.price || '');
        setNeighborhood(d.neighborhood || '');
        setBedrooms(Number(d.bedrooms ?? 2));
        setBathrooms(Number(d.bathrooms ?? 1));
        setSuites(Number(d.suites ?? 0));
        setArea(Number(d.area ?? 100));
        setParkingSpaces(Number(d.parkingSpaces ?? 1));
        setOwnerName(d.ownerName || '');
        setOwnerPhone(d.ownerPhone || '');
        setOwnerEmail(d.ownerEmail || '');
        
        // Match user's simplified fields
        setAddress(d.address || (d.neighborhood ? `${d.neighborhood}, Parnaíba - PI` : ''));
        if (typeof d.acceptsPets === 'boolean') {
          setAcceptsPets(d.acceptsPets);
        } else if (Array.isArray(d.amenities)) {
          setAcceptsPets(d.amenities.includes('pet_friendly'));
        } else {
          setAcceptsPets(true);
        }
        setHasLivingRoom(d.hasLivingRoom ?? true);
        setHasKitchen(d.hasKitchen ?? true);
        
        if (Array.isArray(d.amenities)) {
          setSelectedAmenities(d.amenities);
        }

        // Tentar definir uma imagem combinando com o tipo/comodidade
        if (d.amenities && d.amenities.includes('piscina')) {
          const piscinaImg = POPULAR_IMAGES.find(img => img.label.toLowerCase().includes('piscina'));
          if (piscinaImg) {
            setImageUrl(piscinaImg.url);
          }
        } else if (d.amenities && d.amenities.includes('frente_mar')) {
          const marImg = POPULAR_IMAGES.find(img => img.label.toLowerCase().includes('praia') || img.label.toLowerCase().includes('mar'));
          if (marImg) {
            setImageUrl(marImg.url);
          }
        }

        setAiError('');
      } else {
        throw new Error(result.error || 'Erro inesperado.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError('Não conseguimos analisar seu texto com IA automaticamente. Digite os dados manualmente abaixo!');
    } finally {
      setIsParsingQuickAd(false);
    }
  };

  // If initialProperty is provided, load its values (for editing)
  useEffect(() => {
    if (initialProperty) {
      setTitle(initialProperty.title);
      setDescription(initialProperty.description);
      setType(initialProperty.type);
      setPrice(initialProperty.price);
      setCity(initialProperty.city);
      setNeighborhood(initialProperty.neighborhood);
      setState(initialProperty.state);
      setBedrooms(initialProperty.bedrooms);
      setBathrooms(initialProperty.bathrooms);
      setSuites(initialProperty.suites);
      setArea(initialProperty.area);
      setParkingSpaces(initialProperty.parkingSpaces);
      setSelectedAmenities(initialProperty.amenities);
      
      const isCustomImage = !POPULAR_IMAGES.some(img => img.url === initialProperty.imageUrl);
      if (isCustomImage) {
        setCustomImageUrl(initialProperty.imageUrl);
        setImageUrl(initialProperty.imageUrl);
      } else {
        setImageUrl(initialProperty.imageUrl);
      }
      
      setOwnerName(initialProperty.ownerName);
      setOwnerPhone(initialProperty.ownerPhone);
      setOwnerEmail(initialProperty.ownerEmail || '');
      setOwnerType(initialProperty.ownerType || 'particular');
      
      setAddress(initialProperty.address || '');
      setAcceptsPets(initialProperty.acceptsPets ?? true);
      setHasLivingRoom(initialProperty.hasLivingRoom ?? true);
      setHasKitchen(initialProperty.hasKitchen ?? true);
    }
  }, [initialProperty]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerateDescription = async () => {
    if (!title || !city) {
      setAiError('Por favor, defina pelo menos o título e a cidade antes de gerar a descrição.');
      return;
    }
    setAiError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          city,
          neighborhood,
          type: type === 'temporada' ? 'Temporada' : 'Mensal',
          price,
          bedrooms,
          amenities: selectedAmenities.map(id => ALL_AMENITIES.find(a => a.id === id)?.label || id),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na geração com IA');
      }

      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      } else {
        throw new Error('Sem resposta');
      }
    } catch (e: any) {
      console.error(e);
      // Fallback description maker if api fails or not set up yet
      const fallbackDesc = `Excelente casa em ${city}${neighborhood ? `, no bairro ${neighborhood}` : ''}, disponível para aluguel ${type === 'temporada' ? 'por temporada (diária)' : 'mensal'}. O imóvel conta com ${bedrooms} quarto(s), sendo ${suites} suíte(s), climatizado com ${selectedAmenities.includes('ar_condicionado') ? 'ar condicionado' : 'boa ventilação'}. Próximo a comércios essenciais. Agende uma visita ou tire suas dúvidas!`;
      setDescription(fallbackDesc);
      setAiError('Usamos uma descrição padrão estruturada (Ative seu servidor com Gemini para descrições criativas!).');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomImageUrl(base64String);
        setImageUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !ownerName || !ownerPhone || !address) {
      alert('Por favor, preencha a Foto, Endereço, Nome do Contato, Telefone e valor do Aluguel!');
      return;
    }

    const finalImage = customImageUrl || imageUrl;
    
    // Try to extract neighborhood from address if neighborhood state is blank
    let finalNeighborhood = neighborhood;
    if (!finalNeighborhood) {
      const parts = address.split(/[,-]/);
      finalNeighborhood = parts[parts.length - 1]?.trim() || 'Centro';
    }

    // Determine geographic coordinates based on neighborhood in Parnaíba
    let finalLat = -2.9150;
    let finalLng = -41.7600;
    const nLower = finalNeighborhood.toLowerCase();
    if (nLower.includes('pedra') || nLower.includes('sal')) {
      finalLat = -2.8330 + (Math.random() - 0.5) * 0.005;
      finalLng = -41.7335 + (Math.random() - 0.5) * 0.005;
    } else if (nLower.includes('fátima') || nLower.includes('fatima')) {
      finalLat = -2.9120 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.7650 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes('planalto')) {
      finalLat = -2.9050 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.7350 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes('centro')) {
      finalLat = -2.9150 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.7770 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes('reis veloso') || nLower.includes('ufpi')) {
      finalLat = -2.9010 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.7450 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes('são benedito') || nLower.includes('ufdpar')) {
      finalLat = -2.8980 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.7420 + (Math.random() - 0.5) * 0.003;
    } else {
      finalLat = -2.9150 + (Math.random() - 0.5) * 0.015;
      finalLng = -41.7600 + (Math.random() - 0.5) * 0.015;
    }

    onSubmit({
      id: initialProperty?.id,
      title,
      description: description || `Excelente casa para alugar em Parnaíba no bairro ${finalNeighborhood}. Possui ${bedrooms} quarto(s), ${hasLivingRoom ? 'sala acolhedora, ' : ''}${hasKitchen ? 'cozinha espaçosa ' : ''}e está pronta para morar.`,
      type,
      price: Number(price),
      city: 'Parnaíba',
      neighborhood: finalNeighborhood,
      state: 'PI',
      bedrooms,
      bathrooms: Number(bathrooms) || 1,
      suites: Number(suites) || 0,
      area: Number(area) || 120,
      parkingSpaces: Number(parkingSpaces) || 1,
      amenities: selectedAmenities,
      imageUrl: finalImage,
      ownerName,
      ownerPhone: ownerPhone.replace(/\D/g, ''), // Keep numbers only for clean WhatsApp links
      ownerEmail: ownerEmail || undefined,
      address,
      acceptsPets,
      hasLivingRoom,
      hasKitchen,
      lat: initialProperty?.lat || finalLat,
      lng: initialProperty?.lng || finalLng,
      ownerType,
    });
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
      <div 
        id="property-form-container"
        className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col justify-between animate-slideLeft"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-display text-xl font-extrabold text-slate-800">
              {initialProperty ? 'Editar Anúncio' : 'Anunciar Novo Imóvel'}
            </h2>
            <p className="text-xs text-slate-400">
              Divulgue seu imóvel de forma rápida para milhares de locatários.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors pointer-events-auto"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cadastro Ultra Rápido por IA */}
            {!initialProperty && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider">
                  <span className="text-sm">🪄</span>
                  <span>Anúncio por IA (Estilo Mensagem de WhatsApp)</span>
                  <span className="bg-emerald-600/15 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1">Mais Fácil</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Tem pressa? Escreva ou cole os dados da casa (ex: "Alugo casa no bairro de Fátima com 3 suítes, piscina, aluguel R$ 2500, zap 8699112233") e clique no botão. A IA preenche as especificações abaixo em 1 segundo!
                </p>
                <div className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={quickAdText}
                    onChange={(e) => setQuickAdText(e.target.value)}
                    placeholder="Cole a mensagem do seu anúncio aqui..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium leading-relaxed resize-none"
                  />
                  {aiError && (
                    <p className="text-[10px] text-amber-600 font-extrabold leading-none">
                      ⚠️ {aiError}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold">Apenas para imóveis de Parnaíba (PI)</span>
                    <button
                      type="button"
                      disabled={isParsingQuickAd || !quickAdText.trim()}
                      onClick={handleParseQuickAd}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed hover:shadow-xs transition-all text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer leading-none"
                    >
                      {isParsingQuickAd ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          <span>Adquirindo dados...</span>
                        </>
                      ) : (
                        <>
                          <span>🪄 Preencher Formulário</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seção 1: Foto da Casa */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                🏠 1. Fotos da Casa ou Imóvel *
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Envie uma foto real do seu celular/computador ou selecione uma imagem pronta de nossa galeria para ilustrar o anúncio.
              </p>

              {/* Modern File Uploader Widget */}
              <div className="relative border-2 border-dashed border-slate-250 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-12 w-12 bg-white rounded-full shadow-sm border border-slate-150 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    📷
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">
                      {uploadFileName ? `Selecionado: ${uploadFileName}` : 'Carregar foto do seu celular ou tablet'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Toque para abrir a galeria ou a câmera do seu celular
                    </p>
                  </div>
                </div>
              </div>

              {/* Simple Image Selector Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ou use uma de nossas fotos prontas:</span>
                <button
                  type="button"
                  onClick={() => setShowImageSelector(!showImageSelector)}
                  className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{showImageSelector ? 'Ocultar Galeria' : 'Ver Galeria Sugerida'}</span>
                </button>
              </div>

              {showImageSelector && (
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fadeIn">
                  {POPULAR_IMAGES.map((img) => (
                    <button
                      type="button"
                      key={img.url}
                      onClick={() => {
                        setImageUrl(img.url);
                        setCustomImageUrl('');
                        setUploadFileName('');
                      }}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        (customImageUrl === '' && imageUrl === img.url)
                          ? 'border-emerald-500 ring-4 ring-emerald-100 scale-95'
                          : 'border-transparent opacity-80 hover:opacity-100 hover:scale-102'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] font-bold text-white truncate text-center">
                        {img.label}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Photo Preview & Custom URL Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/30 p-3 rounded-xl border border-slate-100">
                <div className="sm:col-span-1 rounded-xl overflow-hidden aspect-video border bg-slate-100 relative">
                  <img
                    src={customImageUrl || imageUrl}
                    alt="Preview do imóvel"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[8.5px] font-black text-white uppercase tracking-wider">
                    Imagem Selecionada
                  </span>
                </div>

                <div className="sm:col-span-2 flex flex-col justify-center">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ou cole o Link de uma Foto da Web (Opcional)</label>
                  <input
                    type="url"
                    value={customImageUrl.startsWith('data:') ? '' : customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      if (e.target.value) {
                        setImageUrl(e.target.value);
                        setUploadFileName('');
                      } else {
                        setImageUrl(POPULAR_IMAGES[0].url);
                      }
                    }}
                    placeholder="Cole um link direto que termine em .jpg, .png ou .webp..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-705 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all mb-1"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Endereço do Imóvel */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                2. Endereço Completo em Parnaíba
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Endereço (Rua, Número e Bairro de Parnaíba) *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua Pires Rebelo, 1420 - Bairro de Fátima"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Seção 3: Informações de Custos (Preço e Período) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                3. Valor do Aluguel
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Cobrança *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'temporada' | 'mensal')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer text-sm"
                  >
                    <option value="temporada">Aluguel por Temporada (Diário)</option>
                    <option value="mensal">Aluguel Mensal Residencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Valor Comercial (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder={type === 'temporada' ? 'Ex: 250 (por dia)' : 'Ex: 1200 (por mês)'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 4: Características Claras (Quartos, Banheiros, Garagem, Sala, Cozinha, Pets) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                4. Detalhes Internos do Imóvel
              </h3>

              <div className="space-y-4">
                {/* Quantos Quartos */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">🛏️ Quantidade de quartos na casa? *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBedrooms(num)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          bedrooms === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {num} {num === 1 ? 'Quarto' : 'Quartos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantos Banheiros */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">🚿 Quantidade de banheiros? *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBathrooms(num)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          bathrooms === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {num} {num === 1 ? 'Banheiro' : 'Banheiros'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Garagem ou não */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">🚗 Possui Garagem / Vaga de Carro? *</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setParkingSpaces(parkingSpaces > 0 ? parkingSpaces : 1)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        parkingSpaces > 0
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-105'
                      }`}
                    >
                      🚙 Sim, possui vaga
                    </button>
                    <button
                      type="button"
                      onClick={() => setParkingSpaces(0)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        parkingSpaces === 0
                          ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-105'
                      }`}
                    >
                      ❌ Não possui vaga
                    </button>
                  </div>

                  {parkingSpaces > 0 && (
                    <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs animate-fadeIn">
                      <span className="font-semibold text-emerald-800">Quantas vagas de garagem?</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button;button"
                            onClick={() => setParkingSpaces(num)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              parkingSpaces === num
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Living room, Kitchen, Pets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Possui Sala */}
                  <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                    <span className="block text-xs font-bold text-slate-700 mb-2 text-center">Possui Sala?</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHasLivingRoom(true)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          hasLivingRoom
                            ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasLivingRoom(false)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          !hasLivingRoom
                            ? 'bg-slate-700 text-white border-slate-700 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Possui Cozinha */}
                  <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                    <span className="block text-xs font-bold text-slate-700 mb-2 text-center">Possui Cozinha?</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHasKitchen(true)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          hasKitchen
                            ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasKitchen(false)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          !hasKitchen
                            ? 'bg-slate-700 text-white border-slate-700 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Aceita Pets */}
                  <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                    <span className="block text-xs font-bold text-slate-700 mb-2 text-center">Aceita Pet / Animais?</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAcceptsPets(true)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          acceptsPets
                            ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcceptsPets(false)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          !acceptsPets
                            ? 'bg-slate-700 text-white border-slate-700 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 5: Título de Divulgação & Gerador de Descrição com IA */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                5. Título e Divulgação
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título do Anúncio (Curto e Atraente) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ótima casa mobiliada no Centro"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm mb-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-650">Descrição Opcional ou Gerada por IA</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className={`h-3 w-3 text-indigo-500 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Escrevendo...' : 'Gerar com IA Inteligente'}</span>
                  </button>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Escreva algum detalhe extra ou clique acima para gerar um texto atraente de divulgação em segundos de forma automática..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Seção 6: Informações de Contato / Dono do Anúncio */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                6. Informações de Contato
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2">🏢 Tipo de Anunciante *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOwnerType('particular')}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        ownerType === 'particular'
                          ? 'bg-slate-700 text-white border-slate-705 shadow-xs font-black'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>👤 Particular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerType('imobiliaria')}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        ownerType === 'imobiliaria'
                          ? 'bg-emerald-650 text-white border-emerald-650 shadow-xs font-black'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏢 Imobiliária</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Quem é o Contato? (Nome) *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm block"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp de Contato (DDD + Número) *</label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="Ex: 8699112233"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm block"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">E-mail para contatos (opcional)</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="Ex: carlos@imoveis.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm block"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {initialProperty ? 'Salvar Alterações' : 'Publicar Anúncio'}
          </button>
        </div>
      </div>
    </div>
  );
};
