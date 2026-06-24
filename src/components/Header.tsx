import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Sparkles,
  Heart,
  Sun,
  Moon,
  Users,
  Phone,
  Menu,
  X,
  Plus,
  Key,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  Lock,
  Unlock,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  onAddClick: () => void;
  favoritesCount: number;
  onFavoritesClick: () => void;
  showFavoritesOnly: boolean;
  totalProperties: number;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  visitorCount?: number;
  onAdminToggle?: () => void;
  isAdmin?: boolean;
  checkingAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAddClick,
  favoritesCount,
  onFavoritesClick,
  showFavoritesOnly,
  totalProperties,
  theme,
  onThemeToggle,
  visitorCount,
  onAdminToggle,
  isAdmin = false,
  checkingAdmin = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <>
      <header className="sticky top-0 z-45 bg-white/95 backdrop-blur-md border-b border-slate-150 shadow-xs dark:bg-slate-900/95 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-650 text-white shadow-emerald-200 dark:shadow-none shadow-md">
                <span className="text-base text-white">🏠</span>
              </div>
              <div>
                <span className="font-display text-xs sm:text-base md:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 block leading-tight">
                  Aluguel Casa <span className="text-emerald-600 dark:text-emerald-400">Parnaíba PI</span>
                </span>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase leading-none">
                  Grupo de Divulgação
                </p>
              </div>
            </div>

            {/* Core Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                id="header-theme-toggle-btn"
                onClick={onThemeToggle}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shrink-0"
                title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-indigo-600 fill-indigo-100/10" />
                )}
              </button>

              {/* Wishlist Button (Favoritos) */}
              <button
                id="header-wishlist-btn"
                onClick={onFavoritesClick}
                className={`relative flex h-9 w-9 sm:w-auto sm:px-3 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  showFavoritesOnly
                    ? 'bg-red-50 text-red-600 border-red-200 ring-3 ring-red-50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 dark:ring-red-900/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-250 dark:border-slate-700 dark:hover:bg-slate-750'
                }`}
                title="Meus Favoritos"
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-red-500 text-red-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="hidden sm:inline">Favoritos</span>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                    {favoritesCount}
                  </span>
                )}
              </button>



              {/* Live Access Counter (Escondido em telas pequenas) */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/60 shrink-0">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>{visitorCount !== undefined ? `${visitorCount.toLocaleString('pt-BR')} acessos` : '...'}</span>
              </div>

              {/* TRES RISQUINHO DO LADO - MENU HAMBÚRGUER (Principal Botão) */}
              <button
                id="header-menu-hamburger-btn"
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 dark:shadow-none hover:scale-102 active:scale-98 transition-all cursor-pointer"
                title="Menu de Opções"
              >
                <Menu className="h-4.5 w-4.5" />
                <span>Entrar / Opções</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DRAWER LATERAL (MENU HAMBÚRGUER) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop escurecido */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-xs cursor-pointer"
            />

            {/* Painel lateral (Drawer) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-55 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-800 overflow-y-auto"
            >
              {/* Cabeçalho da Drawer */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <span className="text-sm">🏠</span>
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">
                      Opções do Portal
                    </h3>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wide uppercase">
                      Litoral do Piauí
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-400 cursor-pointer"
                  title="Fechar Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corpo de Opções da Drawer */}
              <div className="flex-1 p-5 space-y-6">
                {/* Link para cadastrar imóvel (Chamativo em cima) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 block">
                    Quer Alugar seu Imóvel?
                  </span>
                  <button
                    onClick={() => handleMenuAction(onAddClick)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-650 hover:to-teal-700 text-white shadow-md shadow-emerald-250 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="block text-xs font-black">Anunciar Imóvel</span>
                        <span className="text-[10px] text-emerald-100 font-medium">Grátis e sem cadastro burocrático</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-100" />
                  </button>
                </div>

                {/* Seção dos Grupos do WhatsApp */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 block">
                    Grupos de Divulgação
                  </span>

                  {/* Grupo WhatsApp Aluguel */}
                  <a
                    href="https://chat.whatsapp.com/EYcNd2i0bti4tEUQgfIY8h"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm">
                        💬
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          Grupo de Aluguel de Casas
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                          Grupo Oficial WhatsApp
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                  </a>

                  {/* Grupo Compra & Vendas WhatsApp */}
                  <a
                    href="https://tr.ee/_vp-pq6naZ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50 dark:border-sky-900/30 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sky-500 text-white flex items-center justify-center text-sm">
                        🛒
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          Grupo de Compra e Vendas
                        </span>
                        <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                          Negócios Litoral - WhatsApp
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-sky-600" />
                  </a>

                  {/* Grupo Compra & Vendas Facebook */}
                  <a
                    href="https://www.facebook.com/share/g/1B2NpaQ8zZ/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-650 text-white flex items-center justify-center text-xs">
                        👥
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          Grupo de Compra e Vendas
                        </span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">
                          Página de Vendas no Facebook
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                  </a>
                </div>

                {/* Canal de Achadinhos Do Bass */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 block">
                    Parceiro Especial
                  </span>
                  <a
                    href="https://tr.ee/AReEA4O5R_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-amber-250 bg-amber-50/50 hover:bg-amber-100/50 dark:border-amber-900/30 dark:bg-amber-950/15 dark:hover:bg-amber-950/25 transition-all cursor-pointer text-left relative overflow-hidden group/achado"
                  >
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-550 text-[8px] font-black uppercase text-white rounded-bl-lg">
                      SUPER RECOMENDADO!
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8.5 w-8.5 rounded-lg bg-linear-to-tr from-amber-500 to-orange-550 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200 group-hover/achado:text-amber-700 dark:group-hover/achado:text-amber-400 transition-colors">
                          Do Bass Compre Mais Achadinho
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block leading-tight mt-0.5">
                          Ofertas imperdíveis e cupons de descontos
                        </span>
                      </div>
                    </div>
                  </a>
                </div>

                {/* Área de Acesso (Administrador) */}
                {onAdminToggle && (
                  <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 block">
                      Área Restrita (Administrador)
                    </span>
                    <button
                      onClick={() => handleMenuAction(onAdminToggle)}
                      disabled={checkingAdmin}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left font-bold text-xs disabled:opacity-50 ${
                        isAdmin
                          ? 'border-amber-250 bg-amber-50/30 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-400'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-600'} text-white`}>
                          {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </div>
                        <div>
                          <span>{checkingAdmin ? 'Verificando...' : isAdmin ? 'Sair do Modo Admin' : 'Entrar como Admin'}</span>
                          <span className="block text-[9px] text-slate-400 font-normal">
                            {isAdmin ? 'Você é administrador' : 'Para editar ou excluir anúncios'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-55" />
                    </button>
                  </div>
                )}
              </div>

              {/* Rodapé da Drawer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                  Aluguel Casa Parnaíba PI &copy; 2026
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold mt-1 uppercase tracking-wide">
                  Delta do Parnaíba - Piauí
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
