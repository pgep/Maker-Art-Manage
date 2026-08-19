import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.tsx';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600 select-none">
      {/* Items info */}
      <div className="flex items-center gap-2">
        <span>
          Mostrando <strong className="font-semibold text-slate-900">{startItem}</strong> a{' '}
          <strong className="font-semibold text-slate-900">{endItem}</strong> de{' '}
          <strong className="font-semibold text-slate-900">{totalItems}</strong> registros
        </span>

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200">
            <span>Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Itens por página"
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          className="!px-2 h-7"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  currentPage === p
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="w-5 text-center text-slate-400">
                {p}
              </span>
            )
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
          className="!px-2 h-7"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
