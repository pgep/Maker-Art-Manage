import React, { useState, useEffect, useCallback } from 'react';
import { UnidadeMedida, UnidadeMedidaFormData, ToastMessage } from '../../core/types.ts';
import { UnidadeMedidaApiService } from './services/unidadeMedidaApiService.ts';
import { UnidadeMedidaList } from './components/UnidadeMedidaList.tsx';
import { UnidadeMedidaForm } from './components/UnidadeMedidaForm.tsx';
import { UnidadeMedidaDeleteModal } from './components/UnidadeMedidaDeleteModal.tsx';
import { ToastContainer } from '../../shared/components/ToastContainer.tsx';

export const UnidadesMedidaFeature: React.FC = () => {
  // Navigation sub-state
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUnidade, setSelectedUnidade] = useState<UnidadeMedida | null>(null);

  // List Data State
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal / Form Action States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [unidadeToDelete, setUnidadeToDelete] = useState<UnidadeMedida | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch list
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UnidadeMedidaApiService.list({
        search: searchTerm,
        tipo: tipoFilter,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      });

      setUnidades(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error('Failed to load unidades de medida:', err);
      setError(err?.message || 'Falha ao carregar unidades de medida. Verifique a conexão com o banco.');
      addToast('error', err?.message || 'Erro ao carregar registros', 'Erro');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, tipoFilter, currentPage, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for List
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTipoFilterChange = (value: string) => {
    setTipoFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (column: 'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleNew = () => {
    setSelectedUnidade(null);
    setViewMode('create');
  };

  const handleEdit = (unidade: UnidadeMedida) => {
    setSelectedUnidade(unidade);
    setViewMode('edit');
  };

  const handleDeletePrompt = (unidade: UnidadeMedida) => {
    setUnidadeToDelete(unidade);
  };

  // Save Form (Create / Update)
  const handleSaveForm = async (formData: UnidadeMedidaFormData) => {
    setIsSaving(true);
    try {
      if (viewMode === 'edit' && selectedUnidade) {
        await UnidadeMedidaApiService.update(selectedUnidade.id, formData);
        addToast('success', `Unidade '${formData.nome}' atualizada com sucesso!`, 'Sucesso');
      } else {
        await UnidadeMedidaApiService.create(formData);
        addToast('success', `Unidade '${formData.nome}' cadastrada com sucesso!`, 'Sucesso');
      }

      setViewMode('list');
      setSelectedUnidade(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save unidade de medida:', err);
      addToast('error', err?.message || 'Falha ao salvar a unidade de medida.', 'Erro na Gravação');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!unidadeToDelete) return;

    setIsDeleting(true);
    try {
      await UnidadeMedidaApiService.delete(unidadeToDelete.id);
      addToast('success', `Unidade '${unidadeToDelete.nome}' excluída com sucesso!`, 'Sucesso');
      setUnidadeToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete unidade de medida:', err);
      addToast('error', err?.message || 'Não foi possível excluir o registro.', 'Erro na Exclusão');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main View Router */}
      {viewMode === 'list' && (
        <UnidadeMedidaList
          unidades={unidades}
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          tipoFilter={tipoFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={handleSearchChange}
          onTipoFilterChange={handleTipoFilterChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onNew={handleNew}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onRefresh={loadData}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <UnidadeMedidaForm
          unidade={selectedUnidade}
          onSave={handleSaveForm}
          onCancel={() => {
            setViewMode('list');
            setSelectedUnidade(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirmation Modal */}
      <UnidadeMedidaDeleteModal
        isOpen={Boolean(unidadeToDelete)}
        onClose={() => setUnidadeToDelete(null)}
        onConfirm={handleConfirmDelete}
        unidade={unidadeToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
