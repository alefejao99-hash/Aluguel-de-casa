import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Check,
  ChevronDown,
  Image as ImageIcon,
  HelpCircle,
} from "lucide-react";
import { Property } from "../types";
import { ALL_AMENITIES, STATES_BR, POPULAR_IMAGES } from "../data";

const MAX_PROPERTY_IMAGES = 12;
const MAX_ORIGINAL_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_OPTIMIZED_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

const PLACEHOLDER_IMAGE_URL = POPULAR_IMAGES[0].url;

const isPlaceholderImageUrl = (url: string) => {
  const normalized = String(url || "").trim();
  return (
    normalized === PLACEHOLDER_IMAGE_URL ||
    normalized.endsWith("/sem-foto-imovel.png")
  );
};

const normalizeImageList = (urls: Array<string | undefined | null>) => {
  const cleaned = urls
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .filter((url) => !isPlaceholderImageUrl(url))
    .filter((url, index, arr) => arr.indexOf(url) === index)
    .slice(0, MAX_PROPERTY_IMAGES);

  return cleaned;
};

const getDisplayImage = (url?: string | null) => {
  const cleanUrl = String(url || "").trim();
  return cleanUrl && !isPlaceholderImageUrl(cleanUrl)
    ? cleanUrl
    : PLACEHOLDER_IMAGE_URL;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Não foi possível processar a imagem."));
    img.src = dataUrl;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível otimizar a imagem."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error("Não foi possível preparar a imagem otimizada."));
    reader.readAsDataURL(blob);
  });

const optimizeImageFile = async (file: File) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }

  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error("Imagem muito grande. Envie fotos de até 12 MB cada.");
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(originalDataUrl);
  const longestSide = Math.max(image.width, image.height);
  const scale = Math.min(1, MAX_IMAGE_SIDE / longestSide);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Não foi possível otimizar a imagem neste navegador.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const attempts = [
    { type: "image/webp", quality: 0.84 },
    { type: "image/webp", quality: 0.76 },
    { type: "image/jpeg", quality: 0.82 },
    { type: "image/jpeg", quality: 0.72 },
  ];

  let bestBlob: Blob | null = null;

  for (const attempt of attempts) {
    try {
      const blob = await canvasToBlob(canvas, attempt.type, attempt.quality);
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (blob.size <= MAX_OPTIMIZED_IMAGE_BYTES) {
        bestBlob = blob;
        break;
      }
    } catch {
      // Tenta o próximo formato/qualidade.
    }
  }

  if (!bestBlob) throw new Error("Não foi possível otimizar a imagem.");

  if (bestBlob.size > MAX_OPTIMIZED_IMAGE_BYTES) {
    throw new Error(
      "Mesmo otimizada, a imagem ficou acima de 3 MB. Tente outra foto.",
    );
  }

  const ext = bestBlob.type === "image/webp" ? "webp" : "jpg";
  const baseName =
    file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "foto-imovel";

  return {
    dataUrl: await blobToDataUrl(bestBlob),
    filename: `${baseName}.${ext}`,
    originalBytes: file.size,
    optimizedBytes: bestBlob.size,
  };
};

interface PropertyFormProps {
  onClose: () => void;
  onSubmit: (
    property: Omit<Property, "id" | "createdAt"> & { id?: string },
  ) => void;
  initialProperty?: Property | null;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  onClose,
  onSubmit,
  initialProperty,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"temporada" | "mensal">("temporada");
  const [price, setPrice] = useState<number | "">("");
  const [city, setCity] = useState("Parnaíba");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("PI");
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [suites, setSuites] = useState<number>(0);
  const [area, setArea] = useState<number | "">("");
  const [parkingSpaces, setParkingSpaces] = useState<number>(1);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState(PLACEHOLDER_IMAGE_URL);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerType, setOwnerType] = useState<"particular" | "imobiliaria">(
    "particular",
  );
  const [uploadFileName, setUploadFileName] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Simplified fields requested by the user
  const [address, setAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [livingRooms, setLivingRooms] = useState<number>(1);
  const [kitchens, setKitchens] = useState<number>(1);
  const [acceptsPets, setAcceptsPets] = useState<boolean>(true);
  const [showExactAddress, setShowExactAddress] = useState<boolean>(false);
  const [hasLivingRoom, setHasLivingRoom] = useState<boolean>(true);
  const [hasKitchen, setHasKitchen] = useState<boolean>(true);

  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [quickAdText, setQuickAdText] = useState("");
  const [isParsingQuickAd, setIsParsingQuickAd] = useState(false);

  const addImagesToList = (urls: string[], makeFirst = false) => {
    const cleaned = normalizeImageList(urls);
    if (!cleaned.length) return;

    setImageUrls((prev) => {
      const next = makeFirst
        ? [...cleaned, ...prev.filter((url) => !cleaned.includes(url))]
        : [...prev, ...cleaned];
      return normalizeImageList(next);
    });

    if (makeFirst && cleaned[0]) {
      setImageUrl(cleaned[0]);
      setCustomImageUrl(cleaned[0]);
    }
  };

  const makeCoverImage = (url: string) => {
    if (isPlaceholderImageUrl(url)) {
      setImageUrl(PLACEHOLDER_IMAGE_URL);
      setCustomImageUrl("");
      return;
    }

    setImageUrl(url);
    setCustomImageUrl(url);
    setImageUrls((prev) =>
      normalizeImageList([url, ...prev.filter((item) => item !== url)]),
    );
  };

  const removeImageFromList = (url: string) => {
    setImageUrls((prev) => {
      const normalized = normalizeImageList(
        prev.filter((item) => item !== url),
      );
      if (url === imageUrl) {
        const nextCover = normalized[0] || PLACEHOLDER_IMAGE_URL;
        setImageUrl(nextCover);
        setCustomImageUrl(isPlaceholderImageUrl(nextCover) ? "" : nextCover);
      }
      return normalized;
    });
  };

  const handleParseQuickAd = async () => {
    if (!quickAdText.trim()) return;
    setIsParsingQuickAd(true);
    setAiError("");

    try {
      const response = await fetch("/api/parse-quick-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: quickAdText }),
      });

      if (!response.ok) {
        throw new Error("Falha ao processar texto com IA.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        setTitle(d.title || "");
        setDescription(d.description || "");
        setType(d.type || "temporada");
        setPrice(d.price || "");
        setNeighborhood(d.neighborhood || "");
        setBedrooms(Number(d.bedrooms ?? 2));
        setBathrooms(Number(d.bathrooms ?? 1));
        setSuites(Number(d.suites ?? 0));
        setArea(Number(d.area ?? 100));
        setParkingSpaces(Number(d.parkingSpaces ?? 1));
        setOwnerName(d.ownerName || "");
        setOwnerPhone(d.ownerPhone || "");
        if (d.ownerType === "imobiliaria" || d.ownerType === "particular") {
          setOwnerType(d.ownerType);
        }

        // Match user's simplified fields
        setAddress(
          d.address ||
            (d.neighborhood ? `${d.neighborhood}, Parnaíba - PI` : ""),
        );
        setHouseNumber(d.houseNumber || "");
        setLivingRooms(
          Number(d.livingRooms ?? ((d.hasLivingRoom ?? true) ? 1 : 0)),
        );
        setKitchens(Number(d.kitchens ?? ((d.hasKitchen ?? true) ? 1 : 0)));
        if (typeof d.acceptsPets === "boolean") {
          setAcceptsPets(d.acceptsPets);
        } else if (Array.isArray(d.amenities)) {
          setAcceptsPets(d.amenities.includes("pet_friendly"));
        } else {
          setAcceptsPets(true);
        }
        setHasLivingRoom(d.hasLivingRoom ?? true);
        setHasKitchen(d.hasKitchen ?? true);
        setShowExactAddress(Boolean(d.showExactAddress));

        if (Array.isArray(d.amenities)) {
          setSelectedAmenities(d.amenities);
        }

        // Tentar definir uma imagem combinando com o tipo/comodidade
        if (d.amenities && d.amenities.includes("piscina")) {
          const piscinaImg = POPULAR_IMAGES.find((img) =>
            img.label.toLowerCase().includes("piscina"),
          );
          if (piscinaImg) {
            setImageUrl(piscinaImg.url);
          }
        } else if (d.amenities && d.amenities.includes("frente_mar")) {
          const marImg = POPULAR_IMAGES.find(
            (img) =>
              img.label.toLowerCase().includes("praia") ||
              img.label.toLowerCase().includes("mar"),
          );
          if (marImg) {
            setImageUrl(marImg.url);
          }
        }

        setAiError(
          result.isFallback
            ? result.message ||
                "Algumas informações foram preenchidas automaticamente. Revise todos os campos antes de publicar."
            : "",
        );
      } else {
        throw new Error(result.error || "Erro inesperado.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(
        "Não foi possível organizar as informações automaticamente neste momento. Revise o texto ou preencha os campos manualmente.",
      );
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

      const existingImages = normalizeImageList(
        initialProperty.imageUrls?.length
          ? initialProperty.imageUrls
          : [initialProperty.imageUrl],
      );
      const primaryImage =
        existingImages[0] || getDisplayImage(initialProperty.imageUrl);
      setImageUrls(existingImages);

      const isCustomImage =
        !isPlaceholderImageUrl(primaryImage) &&
        !POPULAR_IMAGES.some((img) => img.url === primaryImage);
      if (isCustomImage) {
        setCustomImageUrl(primaryImage);
        setImageUrl(primaryImage);
      } else {
        setCustomImageUrl("");
        setImageUrl(primaryImage);
      }

      setOwnerName(initialProperty.ownerName);
      setOwnerPhone(initialProperty.ownerPhone);
      setOwnerType(initialProperty.ownerType || "particular");

      setAddress(initialProperty.address || "");
      setHouseNumber(initialProperty.houseNumber || "");
      setLivingRooms(
        initialProperty.livingRooms ??
          ((initialProperty.hasLivingRoom ?? true) ? 1 : 0),
      );
      setKitchens(
        initialProperty.kitchens ??
          ((initialProperty.hasKitchen ?? true) ? 1 : 0),
      );
      setAcceptsPets(initialProperty.acceptsPets ?? true);
      setShowExactAddress(initialProperty.showExactAddress ?? false);
      setHasLivingRoom(initialProperty.hasLivingRoom ?? true);
      setHasKitchen(initialProperty.hasKitchen ?? true);
    }
  }, [initialProperty]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleGenerateDescription = async () => {
    if (!title || !city) {
      setAiError(
        "Por favor, defina pelo menos o título e a cidade antes de gerar a descrição.",
      );
      return;
    }
    setAiError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          city,
          neighborhood,
          type: type === "temporada" ? "Temporada" : "Mensal",
          price,
          bedrooms,
          amenities: selectedAmenities.map(
            (id) => ALL_AMENITIES.find((a) => a.id === id)?.label || id,
          ),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na geração com IA");
      }

      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      } else {
        throw new Error("Sem resposta");
      }
    } catch (e: any) {
      console.error(e);
      // Fallback description maker if api fails or not set up yet
      const fallbackDesc = `Excelente casa em ${city}${neighborhood ? `, no bairro ${neighborhood}` : ""}, disponível para aluguel ${type === "temporada" ? "por temporada (diária)" : "mensal"}. O imóvel conta com ${bedrooms} quarto(s), sendo ${suites} suíte(s), climatizado com ${selectedAmenities.includes("ar_condicionado") ? "ar condicionado" : "boa ventilação"}. Próximo a comércios essenciais. Agende uma visita ou tire suas dúvidas!`;
      setDescription(fallbackDesc);
      setAiError(
        "Usamos uma descrição padrão estruturada (Ative seu servidor com Gemini para descrições criativas!).",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
      ? (Array.from(e.currentTarget.files) as File[])
      : [];
    e.currentTarget.value = "";
    if (!files.length) return;

    const remainingSlots = Math.max(0, MAX_PROPERTY_IMAGES - imageUrls.length);
    if (remainingSlots <= 0) {
      setAiError(
        `Você já adicionou o limite de ${MAX_PROPERTY_IMAGES} fotos neste anúncio.`,
      );
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    setIsUploadingImages(true);
    setAiError(
      `Otimizando e enviando ${selectedFiles.length} foto(s). Aguarde...`,
    );

    const uploadedUrls: string[] = [];
    let totalOriginalBytes = 0;
    let totalOptimizedBytes = 0;

    try {
      for (const file of selectedFiles) {
        const optimized = await optimizeImageFile(file);
        totalOriginalBytes += optimized.originalBytes;
        totalOptimizedBytes += optimized.optimizedBytes;

        const response = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: optimized.dataUrl,
            filename: optimized.filename,
          }),
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success || !result?.url) {
          throw new Error(
            result?.error || `Falha no upload da imagem ${file.name}.`,
          );
        }

        uploadedUrls.push(result.url);
      }

      addImagesToList(uploadedUrls, imageUrls.length === 0);
      if (uploadedUrls[0] && imageUrls.length === 0) {
        setCustomImageUrl(uploadedUrls[0]);
        setImageUrl(uploadedUrls[0]);
      }

      const reduction =
        totalOriginalBytes > 0
          ? Math.max(
              0,
              Math.round((1 - totalOptimizedBytes / totalOriginalBytes) * 100),
            )
          : 0;
      setUploadFileName(`${uploadedUrls.length} foto(s) adicionada(s)`);
      setAiError(
        `Fotos otimizadas e enviadas com sucesso. Redução aproximada: ${reduction}%.`,
      );
    } catch (error: any) {
      console.error(error);
      setUploadFileName("");
      setAiError(
        error?.message ||
          "Não foi possível enviar as imagens. Use a galeria ou cole uma URL HTTPS.",
      );
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title ||
      !price ||
      !ownerName ||
      !ownerPhone ||
      !address ||
      !houseNumber
    ) {
      alert(
        "Por favor, preencha a Foto, Endereço, Número da Casa, Nome do Contato, Telefone e valor do Aluguel!",
      );
      return;
    }

    const realFinalImages = normalizeImageList([
      customImageUrl || imageUrl,
      ...imageUrls,
    ]);
    const finalImages =
      realFinalImages.length > 0 ? realFinalImages : [PLACEHOLDER_IMAGE_URL];
    const finalImage = finalImages[0];

    // Try to extract neighborhood from address if neighborhood state is blank
    let finalNeighborhood = neighborhood;
    if (!finalNeighborhood) {
      const parts = address.split(/[,-]/);
      finalNeighborhood = parts[parts.length - 1]?.trim() || "Centro";
    }

    // Determine geographic coordinates based on neighborhood in Parnaíba
    let finalLat = -2.915;
    let finalLng = -41.76;
    const nLower = finalNeighborhood.toLowerCase();
    if (nLower.includes("pedra") || nLower.includes("sal")) {
      finalLat = -2.833 + (Math.random() - 0.5) * 0.005;
      finalLng = -41.7335 + (Math.random() - 0.5) * 0.005;
    } else if (nLower.includes("fátima") || nLower.includes("fatima")) {
      finalLat = -2.912 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.765 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes("planalto")) {
      finalLat = -2.905 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.735 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes("centro")) {
      finalLat = -2.915 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.777 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes("reis veloso") || nLower.includes("ufpi")) {
      finalLat = -2.901 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.745 + (Math.random() - 0.5) * 0.003;
    } else if (nLower.includes("são benedito") || nLower.includes("ufdpar")) {
      finalLat = -2.898 + (Math.random() - 0.5) * 0.003;
      finalLng = -41.742 + (Math.random() - 0.5) * 0.003;
    } else {
      finalLat = -2.915 + (Math.random() - 0.5) * 0.015;
      finalLng = -41.76 + (Math.random() - 0.5) * 0.015;
    }

    onSubmit({
      id: initialProperty?.id,
      title,
      description:
        description ||
        `Excelente casa para alugar em Parnaíba no bairro ${finalNeighborhood}. Possui ${bedrooms} quarto(s), ${livingRooms} sala(s), ${kitchens} cozinha(s) e está pronta para morar.`,
      type,
      price: Number(price),
      city: "Parnaíba",
      neighborhood: finalNeighborhood,
      state: "PI",
      bedrooms,
      bathrooms: Number(bathrooms) || 1,
      suites: Number(suites) || 0,
      area: Number(area) || 120,
      parkingSpaces: Number(parkingSpaces) || 1,
      amenities: selectedAmenities,
      imageUrl: finalImage,
      imageUrls: finalImages,
      ownerName,
      ownerPhone: ownerPhone.replace(/\D/g, ""), // Keep numbers only for clean WhatsApp links
      address,
      houseNumber,
      showExactAddress,
      livingRooms,
      kitchens,
      acceptsPets,
      hasLivingRoom: livingRooms > 0,
      hasKitchen: kitchens > 0,
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
              {initialProperty ? "Editar Anúncio" : "Anunciar Novo Imóvel"}
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
                  <span>Anúncio por IA</span>
                  <span className="bg-emerald-600/15 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1">
                    Mais Fácil
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Utilize este recurso para transformar as informações do imóvel
                  em um cadastro mais completo e organizado. Informe, sempre que
                  possível, o tipo de locação, bairro, endereço, valor,
                  quantidade de quartos, banheiros, suítes, vagas de garagem,
                  comodidades e telefone de contato. A IA preencherá os campos
                  automaticamente, mas o anunciante deve revisar os dados antes
                  da publicação.
                </p>
                <div className="space-y-2.5">
                  <textarea
                    rows={4}
                    value={quickAdText}
                    onChange={(e) => setQuickAdText(e.target.value)}
                    placeholder="Exemplo: Casa para aluguel mensal no bairro de Fátima, Rua X, nº 123, com 3 quartos, 2 suítes, piscina, garagem para 2 carros, aceita pets, valor R$ 2.500 e contato 86 99999-9999."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium leading-relaxed resize-none"
                  />
                  {aiError && (
                    <p className="text-[10px] text-amber-600 font-extrabold leading-snug">
                      ⚠️ {aiError}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold">
                      Apenas para imóveis de Parnaíba (PI)
                    </span>
                    <button
                      type="button"
                      disabled={isParsingQuickAd || !quickAdText.trim()}
                      onClick={handleParseQuickAd}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed hover:shadow-xs transition-all text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer leading-none"
                    >
                      {isParsingQuickAd ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          <span>Organizando dados...</span>
                        </>
                      ) : (
                        <>
                          <span>🪄 Organizar com IA</span>
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
                Envie uma foto real do seu celular/computador ou selecione uma
                imagem pronta de nossa galeria para ilustrar o anúncio.
              </p>

              {/* Modern File Uploader Widget */}
              <div className="relative border-2 border-dashed border-slate-250 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-12 w-12 bg-white rounded-full shadow-sm border border-slate-150 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    📷
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">
                      {isUploadingImages
                        ? "Otimizando e enviando fotos..."
                        : uploadFileName
                          ? uploadFileName
                          : "Carregar fotos do seu celular ou tablet"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Selecione até 12 fotos. O site otimiza automaticamente
                      antes de enviar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Simple Image Selector Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Ou use uma de nossas fotos prontas:
                </span>
                <button
                  type="button"
                  onClick={() => setShowImageSelector(!showImageSelector)}
                  className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>
                    {showImageSelector
                      ? "Ocultar Galeria"
                      : "Ver Galeria Sugerida"}
                  </span>
                </button>
              </div>

              {showImageSelector && (
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fadeIn">
                  {POPULAR_IMAGES.map((img) => (
                    <button
                      type="button"
                      key={img.url}
                      onClick={() => {
                        makeCoverImage(img.url);
                        setCustomImageUrl("");
                        setUploadFileName("");
                      }}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        customImageUrl === "" && imageUrl === img.url
                          ? "border-emerald-500 ring-4 ring-emerald-100 scale-95"
                          : "border-transparent opacity-80 hover:opacity-100 hover:scale-102"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="h-full w-full object-cover"
                      />
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
                    src={getDisplayImage(customImageUrl || imageUrl)}
                    alt="Preview do imóvel"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[8.5px] font-black text-white uppercase tracking-wider">
                    Imagem Selecionada
                  </span>
                </div>

                <div className="sm:col-span-2 flex flex-col justify-center">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Ou cole o Link de uma Foto da Web (Opcional)
                  </label>
                  <input
                    type="url"
                    value={
                      customImageUrl.startsWith("data:") ? "" : customImageUrl
                    }
                    onChange={(e) => {
                      const url = e.target.value.trim();
                      setCustomImageUrl(url);
                      if (url) {
                        setImageUrl(url);
                        setImageUrls((prev) =>
                          normalizeImageList([url, ...prev]),
                        );
                        setUploadFileName("");
                      } else {
                        const fallback = imageUrls[0] || PLACEHOLDER_IMAGE_URL;
                        setImageUrl(fallback);
                      }
                    }}
                    placeholder="Cole um link direto que termine em .jpg, .png ou .webp..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-705 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all mb-1"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-700">
                      Fotos adicionadas ao anúncio
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      A primeira imagem será usada como capa. Clique em uma foto
                      para torná-la capa.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                    {imageUrls.length}/{MAX_PROPERTY_IMAGES}
                  </span>
                </div>

                {imageUrls.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] font-semibold text-slate-400">
                    Nenhuma foto real adicionada ainda. A imagem “sem foto” será
                    usada apenas como capa provisória até o envio das imagens do
                    imóvel.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imageUrls.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative group rounded-xl overflow-hidden border border-slate-150 bg-slate-100 aspect-video"
                      >
                        <button
                          type="button"
                          onClick={() => makeCoverImage(url)}
                          className="absolute inset-0 z-10"
                          title="Definir como foto de capa"
                        />
                        <img
                          src={url}
                          alt={`Foto ${index + 1} do imóvel`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-black px-1.5 py-1 flex items-center justify-between">
                          <span>
                            {index === 0 ? "CAPA" : `FOTO ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeImageFromList(url);
                            }}
                            className="relative z-20 h-5 w-5 rounded-full bg-red-600 hover:bg-red-700 text-white leading-none flex items-center justify-center"
                            title="Remover foto"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seção 2: Endereço do Imóvel */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                2. Endereço Completo em Parnaíba
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Endereço (Rua, Avenida, Bairro de Parnaíba) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Rua Pires Rebelo, Bairro de Fátima"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Número da Casa / Apto *
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="Ex: 1420 ou S/N"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showExactAddress}
                    onChange={(e) => setShowExactAddress(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <span className="text-[11px] text-amber-800 font-bold leading-relaxed">
                    Autorizo mostrar o endereço exato no anúncio e no mapa. Se
                    deixar desmarcado, o site mostrará apenas o bairro/região
                    aproximada para preservar a privacidade do proprietário.
                  </span>
                </label>
              </div>
            </div>

            {/* Seção 3: Informações de Custos (Preço e Período) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                3. Valor do Aluguel
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tipo de Cobrança *
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "temporada" | "mensal")
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer text-sm"
                  >
                    <option value="temporada">
                      Aluguel por Temporada (Diário)
                    </option>
                    <option value="mensal">Aluguel Mensal Residencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Valor Comercial (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">
                      R$
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder={
                        type === "temporada"
                          ? "Ex: 250 (por dia)"
                          : "Ex: 1200 (por mês)"
                      }
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
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    🛏️ Quantidade de quartos na casa? *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBedrooms(num)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          bedrooms === num
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {num} {num === 1 ? "Quarto" : "Quartos"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantos Banheiros */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    🚿 Quantidade de banheiros? *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBathrooms(num)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          bathrooms === num
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {num} {num === 1 ? "Banheiro" : "Banheiros"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Garagem ou não */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    🚗 Possui Garagem / Vaga de Carro? *
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setParkingSpaces(parkingSpaces > 0 ? parkingSpaces : 1)
                      }
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        parkingSpaces > 0
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-105"
                      }`}
                    >
                      🚙 Sim, possui vaga
                    </button>
                    <button
                      type="button"
                      onClick={() => setParkingSpaces(0)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        parkingSpaces === 0
                          ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-105"
                      }`}
                    >
                      ❌ Não possui vaga
                    </button>
                  </div>

                  {parkingSpaces > 0 && (
                    <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs animate-fadeIn">
                      <span className="font-semibold text-emerald-800">
                        Quantas vagas de garagem?
                      </span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setParkingSpaces(num)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              parkingSpaces === num
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
                  {/* Quantidade de Salas */}
                  <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                    <span className="block text-xs font-bold text-slate-700 mb-2 text-center">
                      Quantas salas? *
                    </span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setLivingRooms(num);
                            setHasLivingRoom(num > 0);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            livingRooms === num
                              ? "bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          {num === 0 ? "Não tem" : num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantidade de Cozinhas */}
                  <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                    <span className="block text-xs font-bold text-slate-700 mb-2 text-center">
                      Quantas cozinhas? *
                    </span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setKitchens(num);
                            setHasKitchen(num > 0);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            kitchens === num
                              ? "bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          {num === 0 ? "Não tem" : num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aceita Pets */}
                  <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                    <span className="block text-xs font-bold text-slate-700 mb-2 text-center">
                      Aceita Pet / Animais?
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAcceptsPets(true)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          acceptsPets
                            ? "bg-emerald-600 text-white border-emerald-600 font-extrabold"
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcceptsPets(false)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          !acceptsPets
                            ? "bg-slate-700 text-white border-slate-700 font-extrabold"
                            : "bg-white border-slate-200 text-slate-500"
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
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Título do Anúncio (Curto e Atraente) *
                </label>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700">
                      Descrição do imóvel *
                    </label>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                      Informe os principais detalhes do imóvel, como estado de
                      conservação, localização, proximidades, diferenciais,
                      regras da locação e informações importantes para o
                      interessado. Uma boa descrição ajuda o cliente a entender
                      melhor o imóvel antes de entrar em contato.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-700 text-[11px] font-extrabold hover:bg-indigo-100 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles
                      className={`h-3.5 w-3.5 text-indigo-500 ${isGenerating ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isGenerating ? "Gerando..." : "Gerar descrição com IA"}
                    </span>
                  </button>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={30}
                  rows={5}
                  placeholder="Exemplo: Casa bem localizada, próxima a mercados e farmácias, com ambientes amplos, boa ventilação e espaço ideal para família. Informe também regras importantes, condições da locação e diferenciais do imóvel."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium leading-relaxed resize-y min-h-[140px]"
                />

                <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                  Você pode escrever manualmente ou usar a IA para criar uma
                  descrição inicial e revisar antes de publicar.
                </p>
              </div>
            </div>

            {/* Seção 6: Informações de Contato / Dono do Anúncio */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                6. Informações de Contato
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    🏢 Tipo de Anunciante *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOwnerType("particular")}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        ownerType === "particular"
                          ? "bg-slate-700 text-white border-slate-705 shadow-xs font-black"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>👤 Particular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerType("imobiliaria")}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        ownerType === "imobiliaria"
                          ? "bg-emerald-650 text-white border-emerald-650 shadow-xs font-black"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏢 Imobiliária</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Quem é o Contato? (Nome) *
                  </label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    WhatsApp de Contato (DDD + Número) *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="Ex: 8699112233"
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
            type="button"
            onClick={handleSubmit}
            disabled={isUploadingImages}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isUploadingImages
              ? "Enviando fotos..."
              : initialProperty
                ? "Salvar Alterações"
                : "Publicar Anúncio"}
          </button>
        </div>
      </div>
    </div>
  );
};
