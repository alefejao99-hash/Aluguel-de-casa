import React, { useState } from 'react';
import { 
  X, MapPin, Bed, Bath, Maximize2, Car, Calendar, 
  Phone, Mail, Copy, Check, Heart, Edit, Trash2,
  Wifi, Flame, Wind, Sofa, Activity, Sunset, Trees, 
  HelpCircle, Sparkles, Building2, ExternalLink
} from 'lucide-react';
import { Property } from '../types';
import { ALL_AMENITIES } from '../data';

interface PropertyDetailsProps {
  property: Property;
  onClose: () => void;
  isFavorite: boolean;
  onFavoriteToggle: (id: string, e: React.MouseEvent) => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  onClose,
  isFavorite,
  onFavoriteToggle,
  onEdit,
  onDelete,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Simulator states
  const [stayValue, setStayValue] = useState<number>(property.type === 'temporada' ? 5 : 12); // Days or Months

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(property.price);

  // Map amenities to their specific React icons
  const getAmenityIcon = (id: string) => {
    switch (id) {
      case 'wifi':
        return <Wifi className="h-4 w-4 text-emerald-600" />;
      case 'churrasqueira':
        return <Flame className="h-4 w-4 text-emerald-600" />;
      case 'ar_condicionado':
        return <Wind className="h-4 w-4 text-emerald-600" />;
      case 'piscina':
        return (
          <svg className="h-4 w-4 text-emerald-600 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          </svg>
        );
      case 'mobiliado':
        return <Sofa className="h-4 w-4 text-emerald-600" />;
      case 'garagem':
        return <Car className="h-4 w-4 text-emerald-600" />;
      case 'academia':
        return <Activity className="h-4 w-4 text-emerald-600" />;
      case 'frente_mar':
        return <Sunset className="h-4 w-4 text-emerald-600" />;
      case 'jardim':
        return <Trees className="h-4 w-4 text-emerald-600" />;
      default:
        return <Building2 className="h-4 w-4 text-emerald-600" />;
    }
  };

  // Create customized link for disclosure
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?casa=${property.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Create WhatsApp direct messaging URL
  const getWhatsAppLink = () => {
    const formattedPriceVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price);
    const period = property.type === 'temporada' ? 'diária' : 'mensal';
    const textMsg = `Olá ${property.ownerName}, vi o seu anúncio da casa "${property.title}" em ${property.city} (${formattedPriceVal}/${period}) no DivulgaCasas e gostaria de tirar algumas dúvidas!`;
    const encodedText = encodeURIComponent(textMsg);
    // Remove any special characters to leave phone number safe
    const phoneClean = property.ownerPhone.replace(/\D/g, '');
    return `https://wa.me/55${phoneClean}?text=${encodedText}`;
  };

  // Simulation calculations
  const calculateSimulation = () => {
    if (property.type === 'temporada') {
      const dailyPrice = property.price;
      const totalOriginal = dailyPrice * stayValue;
      let discount = 0;
      
      // Multi-day discounts
      if (stayValue >= 15) {
        discount = 0.15; // 15% discount for 15+ days
      } else if (stayValue >= 7) {
        discount = 0.10; // 10% discount for 7+ days
      }

      const totalWithDiscount = totalOriginal * (1 - discount);
      const discountValue = totalOriginal * discount;

      return {
        unitLabel: stayValue === 1 ? 'diária' : 'diárias',
        totalOriginal,
        discountPercent: discount * 100,
        discountValue,
        totalWithDiscount,
        cleaningFee: 150,
        finalTotal: totalWithDiscount + 150
      };
    } else {
      // Monthly simulation
      const rentValue = property.price;
      const totalRentContract = rentValue * stayValue;
      const estimatedCondo = Math.round(rentValue * 0.12); // estimated condomínio (12%)
      const estimatedIptu = Math.round(rentValue * 0.03); // estimated IPTU (3%)
      
      // Safety deposit (usually 2 or 3 months rent)
      const safetyDeposit = rentValue * 2;

      return {
        unitLabel: stayValue === 1 ? 'mês' : 'meses',
        totalRentContract,
        estimatedCondo,
        estimatedIptu,
        safetyDeposit,
        monthlyTotal: rentValue + estimatedCondo + estimatedIptu
      };
    }
  };

  const simulation = calculateSimulation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        id="property-details-container"
        className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
      >
        
        {/* Left Side: Images, details, action items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Cover photo and micro interactions overlay */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
            <img
              src={property.imageUrl}
              alt={property.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            
            {/* Direct Close Button in image border */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/50 hover:bg-slate-900/75 text-white backdrop-blur-xs transition-colors pointer-events-auto"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Favorite toggle overlay */}
            <button
              onClick={(e) => onFavoriteToggle(property.id, e)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-400 hover:text-red-500 shadow-md backdrop-blur-xs transition-all pointer-events-auto"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
                }`}
              />
            </button>
            
            {/* Type badge overlay */}
            <div className="absolute bottom-4 left-4 z-10">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase shadow-md ${
                  property.type === 'temporada' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {property.type === 'temporada' ? 'Aluguel Temporada' : 'Aluguel Mensal'}
              </span>
            </div>
          </div>

          {/* Core Info */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <MapPin className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {property.address || `${property.neighborhood}, ${property.city} - ${property.state}`}
              </span>
            </div>
            
            <h1 className="font-display text-2xl font-extrabold text-slate-800 leading-tight mb-3">
              {property.title}
            </h1>
            
            {/* Dynamic visual price display */}
            <div className="flex items-baseline gap-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 inline-flex">
              <span className="text-sm font-bold text-slate-400 self-center mr-1">R$</span>
              <span className="font-display text-3xl font-black text-slate-800 tracking-tight">
                {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(property.price)}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase ml-1">
                / {property.type === 'temporada' ? 'dia' : 'mês'}
              </span>
            </div>
          </div>

          {/* Quick Specs Grid (Quartos, Banheiros, Garagem, Sala, Cozinha, Animais/Pet) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            {/* Quartos */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-slate-550 shadow-xs">
                <Bed className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Quartos</p>
                <p className="text-xs font-black text-slate-750">{property.bedrooms} {property.bedrooms === 1 ? 'Quarto' : 'Quartos'}</p>
              </div>
            </div>

            {/* Banheiros */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-slate-550 shadow-xs">
                <Bath className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Banheiros</p>
                <p className="text-xs font-black text-slate-750">{property.bathrooms} {property.bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</p>
              </div>
            </div>

            {/* Garagem */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-slate-550 shadow-xs">
                <Car className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Garagem</p>
                <p className="text-xs font-black text-slate-750">
                  {property.parkingSpaces > 0 ? (property.parkingSpaces === 1 ? 'Sim (1 vaga)' : `Sim (${property.parkingSpaces} vagas)`) : 'Não possui'}
                </p>
              </div>
            </div>

            {/* Sala */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-slate-550 shadow-xs">
                <Sofa className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Sala</p>
                <p className="text-xs font-black text-slate-755">{property.hasLivingRoom ?? true ? 'Possui Sala' : 'Não possui'}</p>
              </div>
            </div>

            {/* Cozinha */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-slate-550 shadow-xs">
                <svg className="h-4.5 w-4.5 text-emerald-600 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Cozinha</p>
                <p className="text-xs font-black text-slate-755">{property.hasKitchen ?? true ? 'Possui Cozinha' : 'Não possui'}</p>
              </div>
            </div>

            {/* Pets */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-slate-550 shadow-xs">
                <span className="text-sm">🐶</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Aceita Pets?</p>
                <p className={`text-xs font-black ${property.acceptsPets ?? true ? 'text-emerald-700' : 'text-red-500'}`}>
                  {property.acceptsPets ?? true ? 'Aceita Pets' : 'Não Aceita'}
                </p>
              </div>
            </div>
          </div>

          {/* Amenities details list */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              O que este espaco oferece
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {property.amenities.length > 0 ? (
                property.amenities.map((id) => {
                  const label = ALL_AMENITIES.find((a) => a.id === id)?.label || id;
                  return (
                    <div key={id} className="flex items-center gap-2 px-3 py-2 border border-slate-50 bg-slate-50/60 rounded-xl">
                      <div className="h-7 w-7 bg-white shrink-0 rounded-lg border border-slate-150 flex items-center justify-center shadow-xs">
                        {getAmenityIcon(id)}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhuma comodidade extra listada.</p>
              )}
            </div>
          </div>

          {/* Complete Description */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              Descricao do imovel
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
              {property.description}
            </p>
          </div>

          {/* Simulated Location Map Card */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              Simulacao de Localizacao
            </h3>
            <div className="relative h-48 bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden flex flex-col justify-end">
              {/* Soft decorative geographic lines simulating map */}
              <div className="absolute inset-0 bg-slate-50/20 [background-image:radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-45"></div>
              
              {/* Visual simulated pins */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
                <div className="relative z-10 h-10 w-10 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md">
                  <MapPin className="h-5 w-5 fill-white" />
                </div>
                <span className="mt-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-black text-white shrink-0 shadow-lg select-none">
                  Aprox: {property.neighborhood}
                </span>
              </div>

              {/* Security overlay */}
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 border border-slate-150 p-2.5 rounded-xl backdrop-blur-xs text-[10px] text-slate-500 font-medium">
                🔒 Por segurança de privacidade do proprietário, o endereço exato é fornecido de forma reservada diretamente pelo canal de contato.
              </div>
            </div>
          </div>

          {/* Admin Tools: Edit or Delete Anúncio */}
          <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
            {showDeleteConfirm ? (
              <div className="bg-red-50 dark:bg-slate-900 border border-red-200 dark:border-red-950 p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex items-start gap-2 text-red-800 dark:text-red-400">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black">Deseja realmente excluir este anúncio permanentemente?</p>
                    <p className="text-[11px] text-red-650 dark:text-red-350 leading-relaxed font-semibold">Esta ação é irreversível e o anúncio será removido da base de dados do grupo.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Não, manter anúncio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(property.id);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Sim, excluir agora
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium justify-between">
                <span>Cadastrado em {new Date(property.createdAt).toLocaleDateString('pt-BR')}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(property)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer transition-colors"
                    title="Editar Anúncio"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600 font-semibold cursor-pointer transition-colors"
                    title="Excluir Anúncio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Sticky / Desktop Sidebar: Simulator, Owner Contact Details */}
        <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar md:max-h-full">
          <div className="space-y-6">
            
            {/* Owner Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Anunciante Contato</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black font-display text-sm">
                  {property.ownerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">{property.ownerName}</h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {property.ownerType === 'imobiliaria' ? '🏢 Imobiliária Parceira' : '👤 Proprietário Particular'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <a 
                  href={`tel:+55${property.ownerPhone}`}
                  className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold">{property.ownerPhone}</span>
                </a>
                
                {property.ownerEmail && (
                  <a 
                    href={`mailto:${property.ownerEmail}`}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate font-semibold">{property.ownerEmail}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Interactive Simulator widget */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex items-center gap-1.5 text-slate-700 font-display font-black text-sm border-b border-slate-100 pb-2">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Simulador de Locação</span>
              </div>

              {property.type === 'temporada' ? (
                // Vacation daily calculator
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Duração da estadia:</span>
                    <span className="text-emerald-700 font-black">{stayValue} {stayValue === 1 ? 'dia' : 'dias'}</span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={stayValue}
                    onChange={(e) => setStayValue(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>{stayValue}x Diária</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.totalOriginal)}
                      </span>
                    </div>

                    {'discountPercent' in simulation && simulation.discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-650 font-bold">
                        <span>Desconto Especial (-{simulation.discountPercent}%)</span>
                        <span>
                          -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.discountValue)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Taxa única de Limpeza</span>
                      <span>R$ 150</span>
                    </div>

                    <div className="flex justify-between text-slate-800 font-black border-t border-dashed border-slate-200 pt-2 text-sm">
                      <span>Soma Total Estimada:</span>
                      <span className="text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.finalTotal!)}
                      </span>
                    </div>
                  </div>

                  {stayValue < 7 && (
                    <p className="p-2 bg-amber-50 rounded-lg text-[9px] text-amber-700 font-semibold">
                      💡 Ganhe 10% de desconto fechando 7 dias ou mais!
                    </p>
                  )}
                  {stayValue >= 7 && stayValue < 15 && (
                    <p className="p-2 bg-emerald-50 rounded-lg text-[9px] text-emerald-700 font-semibold">
                      🎉 10% de desconto aplicado! Feche 15+ dias para ganhar 15%!
                    </p>
                  )}
                  {stayValue >= 15 && (
                    <p className="p-2 bg-emerald-50 rounded-lg text-[9px] text-emerald-700 font-semibold">
                      🔥 Super desconto de 15% aplicado! Ótima escolha.
                    </p>
                  )}
                </div>
              ) : (
                // Long-term Monthly calculator
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Contrato sugerido:</span>
                    <span className="text-emerald-700 font-black">{stayValue} {stayValue === 1 ? 'mês' : 'meses'}</span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="36"
                    value={stayValue}
                    onChange={(e) => setStayValue(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Aluguel base</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Estimativa de Condomínio</span>
                      <span>
                        +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.estimatedCondo!)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Estimativa de IPTU</span>
                      <span>
                        +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.estimatedIptu!)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-800 font-black border-t border-dashed border-slate-200 pt-2 text-sm">
                      <span>Total Mensal Médio:</span>
                      <span className="text-emerald-600 border-b border-dashed border-emerald-200">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.monthlyTotal!)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] space-y-1 text-slate-400 border border-slate-150 mt-2">
                      <div className="flex justify-between font-bold text-slate-500">
                        <span>Caução sugerido (2 meses):</span>
                        <span>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(simulation.safetyDeposit!)}
                        </span>
                      </div>
                      <p className="leading-tight">Geralmente devolvido pelo proprietário na rescisão contratual.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call-to-actions buttons */}
          <div className="space-y-2 mt-6">
            {/* Share action banner button */}
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Link de Divulgação Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar Link de Divulgação</span>
                </>
              )}
            </button>

            {/* Direct WhatsApp Message Button */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-emerald-150 cursor-pointer transition-all"
            >
              <Phone className="h-4 w-4 shrink-0 fill-white text-emerald-600" />
              <span>Contactar Proprietário</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
