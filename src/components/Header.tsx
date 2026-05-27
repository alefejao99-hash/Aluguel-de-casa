import React from 'react';
import { Home, Sparkles, Heart, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onAddClick: () => void;
  favoritesCount: number;
  onFavoritesClick: () => void;
  showFavoritesOnly: boolean;
  totalProperties: number;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddClick,
  favoritesCount,
  onFavoritesClick,
  showFavoritesOnly,
  totalProperties,
  theme,
  onThemeToggle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-150 shadow-sm dark:bg-slate-900/95 dark:backdrop-blur-md dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none shadow-md">
              <span className="text-base text-white">🏠</span>
            </div>
            <div>
              <span className="font-display text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 block leading-tight">
                Aluguel Casa <span className="text-emerald-600 dark:text-emerald-400">Parnaíba PI</span>
              </span>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase leading-none">
                Grupo de Divulgação
              </p>
            </div>
          </div>
          
          {/* Core Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              id="header-theme-toggle-btn"
              onClick={onThemeToggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-650 fill-indigo-100/10" />
              )}
            </button>

            {/* WhatsApp Group Direct Link Button */}
            <a
              href="https://chat.whatsapp.com/EYcNd2i0bti4tEUQgfIY8h"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-250 dark:border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-405 shadow-xs transition-all animate-pulse"
              title="Entrar no Grupo de Aluguel no WhatsApp"
            >
              <span className="text-base">💬</span>
              <span className="hidden md:inline">Grupo WhatsApp</span>
              <span className="md:hidden">Grupo</span>
            </a>

            {/* Wishlist Button */}
            <button
              id="header-wishlist-btn"
              onClick={onFavoritesClick}
              className={`relative flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                showFavoritesOnly
                  ? 'bg-red-50 text-red-600 border-red-200 ring-4 ring-red-50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 dark:ring-red-900/10'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-250 dark:border-slate-700 dark:hover:bg-slate-750'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-red-500 text-red-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="hidden sm:inline">Favoritos</span>
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Quick Promo Info */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-3 py-2 border border-emerald-100 dark:border-emerald-900/30">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span>{totalProperties} imóveis cadastrados para aluguel</span>
            </div>

            {/* + Add Property button */}
            <button
              id="header-add-property-btn"
              onClick={onAddClick}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-650 dark:hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-100 dark:shadow-none ring-2 ring-transparent hover:ring-emerald-200 transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">Anunciar Imóvel</span>
              <span className="sm:hidden">Anunciar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
