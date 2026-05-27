import React, { useState } from "react";
import {
  X,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Car,
  Calendar,
  Phone,
  Copy,
  Check,
  Heart,
  Edit,
  Trash2,
  Wifi,
  Flame,
  Wind,
  Sofa,
  Activity,
  Sunset,
  Trees,
  HelpCircle,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Property } from "../types";
import { ALL_AMENITIES } from "../data";

interface PropertyDetailsProps {
  property: Property;
  onClose: () => void;
  isFavorite: boolean;
  onFavoriteToggle: (id: string, e: React.MouseEvent) => void;
  isAdmin?: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => void;
}

const currencyBRL = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);

const buildFullAddress = (property: Property) => {
  const numberPart = property.houseNumber ? `, Nº ${property.houseNumber}` : "";
  return property.address
    ? `${property.address}${numberPart}, ${property.city} - ${property.state}`
    : `${property.neighborhood}, ${property.city} - ${property.state}`;
};

const buildApproxAddress = (property: Property) =>
  `${property.neighborhood}, ${property.city} - ${property.state}`;

const googleMapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const googleMapsFreeEmbedUrl = (query: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  onClose,
  isFavorite,
  onFavoriteToggle,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const galleryImages = property.imageUrls?.length
    ? property.imageUrls
    : [property.imageUrl];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage =
    galleryImages[activeImageIndex] || galleryImages[0] || property.imageUrl;

  const formattedPrice = currencyBRL(property.price);

  const formatCount = (value: unknown, singular: string, plural: string) => {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return "Não informado";
    }

    if (numberValue === 0) {
      return `Não possui ${singular}`;
    }

    return `${numberValue} ${numberValue === 1 ? singular : plural}`;
  };

  const petPolicy =
    typeof property.acceptsPets === "boolean"
      ? property.acceptsPets
        ? "Aceita pets"
        : "Não aceita pets"
      : property.amenities.includes("pet_friendly")
        ? "Aceita pets"
        : "Não informado";

  const propertyCharacteristics = [
    {
      label: "Quartos",
      value: formatCount(property.bedrooms, "quarto", "quartos"),
      icon: <Bed className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Banheiros",
      value: formatCount(property.bathrooms, "banheiro", "banheiros"),
      icon: <Bath className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Suítes",
      value: formatCount(property.suites, "suíte", "suítes"),
      icon: <Bed className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Área construída",
      value: property.area > 0 ? `${property.area} m²` : "Não informado",
      icon: <Maximize2 className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Garagem",
      value:
        property.parkingSpaces > 0
          ? formatCount(property.parkingSpaces, "vaga", "vagas")
          : "Não possui vaga",
      icon: <Car className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Sala",
      value:
        property.livingRooms !== undefined
          ? formatCount(property.livingRooms, "sala", "salas")
          : property.hasLivingRoom === false
            ? "Não possui sala"
            : "Não informado",
      icon: <Sofa className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Cozinha",
      value:
        property.kitchens !== undefined
          ? formatCount(property.kitchens, "cozinha", "cozinhas")
          : property.hasKitchen === false
            ? "Não possui cozinha"
            : "Não informado",
      icon: <Building2 className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: "Pets",
      value: petPolicy,
      icon: <span className="text-lg">🐶</span>,
    },
  ];

  const visibleAmenityIds = property.amenities.filter(
    (id) => !["pet_friendly", "garagem"].includes(id),
  );

  // Map amenities to their specific React icons
  const getAmenityIcon = (id: string) => {
    switch (id) {
      case "wifi":
        return <Wifi className="h-4 w-4 text-emerald-600" />;
      case "churrasqueira":
        return <Flame className="h-4 w-4 text-emerald-600" />;
      case "ar_condicionado":
        return <Wind className="h-4 w-4 text-emerald-600" />;
      case "piscina":
        return (
          <svg
            className="h-4 w-4 text-emerald-600 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          </svg>
        );
      case "mobiliado":
        return <Sofa className="h-4 w-4 text-emerald-600" />;
      case "garagem":
        return <Car className="h-4 w-4 text-emerald-600" />;
      case "academia":
        return <Activity className="h-4 w-4 text-emerald-600" />;
      case "frente_mar":
        return <Sunset className="h-4 w-4 text-emerald-600" />;
      case "jardim":
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
    const formattedPriceVal = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(property.price);
    const period = property.type === "temporada" ? "diária" : "mensal";
    const textMsg = `Olá ${property.ownerName}, vi o seu anúncio da casa "${property.title}" em ${property.city} (${formattedPriceVal}/${period}) no Aluguel Casa Parnaíba e gostaria de conversar sobre a locação!`;
    const encodedText = encodeURIComponent(textMsg);
    // Remove any special characters to leave phone number safe
    const phoneClean = property.ownerPhone.replace(/\D/g, "");
    return `https://wa.me/55${phoneClean}?text=${encodedText}`;
  };

  const exactAddress = buildFullAddress(property);
  const approximateAddress = buildApproxAddress(property);
  const canShowExactAddress = Boolean(
    property.showExactAddress && property.address,
  );
  const publicLocationLabel = canShowExactAddress
    ? exactAddress
    : approximateAddress;
  const mapsQuery = canShowExactAddress ? exactAddress : approximateAddress;
  const mapsEmbedSrc = googleMapsFreeEmbedUrl(mapsQuery);
  const mapsExternalUrl = googleMapsSearchUrl(mapsQuery);

  const showPreviousImage = () => {
    setActiveImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  };

  const showNextImage = () => {
    setActiveImageIndex((current) => (current + 1) % galleryImages.length);
  };

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
              src={activeImage}
              alt={property.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/55 hover:bg-slate-900/75 text-white backdrop-blur-xs transition-all"
                  title="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/55 hover:bg-slate-900/75 text-white backdrop-blur-xs transition-all"
                  title="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/70 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}

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
                  isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"
                }`}
              />
            </button>

            {/* Type badge overlay */}
            <div className="absolute bottom-4 left-4 z-10">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase shadow-md ${
                  property.type === "temporada"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {property.type === "temporada"
                  ? "Aluguel Temporada"
                  : "Aluguel Mensal"}
              </span>
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {galleryImages.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition-all ${
                    index === activeImageIndex
                      ? "border-emerald-500 ring-4 ring-emerald-100"
                      : "border-slate-150 opacity-75 hover:opacity-100"
                  }`}
                  title={`Ver foto ${index + 1}`}
                >
                  <img
                    src={url}
                    alt={`Miniatura ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Core Info */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <MapPin className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {publicLocationLabel}
              </span>
            </div>

            <h1 className="font-display text-2xl font-extrabold text-slate-800 leading-tight mb-3">
              {property.title}
            </h1>

            {/* Dynamic visual price display */}
            <div className="flex items-baseline gap-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 inline-flex">
              <span className="text-sm font-bold text-slate-400 self-center mr-1">
                R$
              </span>
              <span className="font-display text-3xl font-black text-slate-800 tracking-tight">
                {new Intl.NumberFormat("pt-BR", {
                  maximumFractionDigits: 0,
                }).format(property.price)}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase ml-1">
                / {property.type === "temporada" ? "dia" : "mês"}
              </span>
            </div>
          </div>

          {/* Property Characteristics */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-display text-lg font-extrabold text-slate-900">
                Características do imóvel
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Informações cadastradas pelo anunciante sobre a estrutura do
                imóvel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {propertyCharacteristics.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-150 bg-white p-4 shadow-xs"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities details list */}
          {visibleAmenityIds.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                Comodidades e diferenciais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleAmenityIds.map((id) => {
                  const label =
                    ALL_AMENITIES.find((a) => a.id === id)?.label || id;

                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-150 bg-slate-50 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xs">
                        {getAmenityIcon(id)}
                      </div>

                      <span className="text-sm font-bold text-slate-800">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Complete Description */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              Descricao do imovel
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
              {property.description}
            </p>
          </div>

          {/* Location Map Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="font-display text-base font-bold text-slate-800">
                Localizacao do imovel
              </h3>
              <a
                href={mapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver no Maps
              </a>
            </div>

            <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-emerald-50">
              <iframe
                title={`Mapa de ${property.title}`}
                src={mapsEmbedSrc}
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              <div className="bg-white/95 border-t border-slate-150 p-3 text-[10px] text-slate-600 font-semibold leading-relaxed">
                {canShowExactAddress ? (
                  <>
                    📍 Endereço autorizado pelo anunciante:{" "}
                    <strong>{publicLocationLabel}</strong>.
                  </>
                ) : (
                  <>
                    🔒 Localização aproximada:{" "}
                    <strong>{publicLocationLabel}</strong>. O endereço exato
                    deve ser confirmado diretamente com o anunciante.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Admin Tools: Edit or Delete Anúncio */}
          {isAdmin && onEdit && onDelete && (
            <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
              {showDeleteConfirm ? (
                <div className="bg-red-50 dark:bg-slate-900 border border-red-200 dark:border-red-950 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-start gap-2 text-red-800 dark:text-red-400">
                    <span className="text-base shrink-0">⚠️</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black">
                        Deseja realmente excluir este anúncio permanentemente?
                      </p>
                      <p className="text-[11px] text-red-650 dark:text-red-350 leading-relaxed font-semibold">
                        Esta ação é irreversível e o anúncio será removido da
                        base de dados do grupo.
                      </p>
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
                  <span>
                    Cadastrado em{" "}
                    {new Date(property.createdAt).toLocaleDateString("pt-BR")}
                  </span>
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
          )}
        </div>

        {/* Right Side Sticky / Desktop Sidebar: Owner Contact Details */}
        <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar md:max-h-full">
          <div className="space-y-6">
            {/* Owner Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                Anunciante Contato
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black font-display text-sm">
                  {property.ownerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">
                    {property.ownerName}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {property.ownerType === "imobiliaria"
                      ? "🏢 Imobiliária Parceira"
                      : "👤 Proprietário Particular"}
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
              </div>
            </div>

            {/* Call-to-actions buttons */}
            <div className="space-y-2 mt-6">
              {/* Share action banner button */}
              <button
                onClick={handleCopyLink}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  copiedLink
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
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
    </div>
  );
};
