import React, { useState } from 'react';
import {
  Menu,
  X,
  Scale,
  FolderTree,
  ChevronDown,
  Layers,
  Sparkles,
  Database,
  Hammer,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCadastrosExpanded, setIsCadastrosExpanded] = useState(true);

  return (
    <div className="min-h-screen h-screen flex flex-col bg-slate-100/70 text-slate-800 antialiased overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Alternar menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* App Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Hammer className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  Maker Art Manage
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none hidden sm:block">
                Sistema de Gestão para Artesãos
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Items */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Conectado</span>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center">
              M
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-semibold text-slate-800">Ateliê Maker</p>
              <p className="text-[10px] text-slate-400">Modo Administrador</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY WITH SIDEBAR & MAIN AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-2xs"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR (Menu Lateral) */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-20
            w-64 bg-white border-r border-slate-200 flex flex-col justify-between
            transition-transform duration-200 ease-in-out select-none
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            top-14 md:top-0
          `}
        >
          <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {/* Cadastros Group */}
            <div>
              <button
                type="button"
                onClick={() => setIsCadastrosExpanded(!isCadastrosExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Cadastros</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isCadastrosExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {isCadastrosExpanded && (
                <div className="mt-1 space-y-1 pl-1">
                  <button
                    onClick={() => {
                      onNavigate('unidades-medida');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'unidades-medida'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Scale
                        className={`w-4 h-4 ${
                          currentView === 'unidades-medida' ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <span>Unidade de Medida</span>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        currentView === 'unidades-medida'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      M1
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Modular note */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Arquitetura Modular</span>
              </div>
              <p>
                Módulo 01 ativo. Novos módulos como Insumos, Produtos e Produção serão acoplados aqui nas próximas etapas.
              </p>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span>Maker Art Manage</span>
              <span className="font-semibold text-slate-700">Módulo 01</span>
            </div>
          </div>
        </aside>

        {/* 3. ÁREA PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
