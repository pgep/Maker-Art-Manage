import React, { useState, useEffect, useCallback } from 'react';
import { TipoInsumo, TipoInsumoFormData, ToastMessage } from '../../core/types.ts';
import { TipoInsumoApiService } from './services/tipoInsumoApiService.ts';
import { TipoInsumoList } from './components/TipoInsumoList.tsx';
import { TipoInsumoForm } from './components/TipoInsumoForm.tsx';
import { TipoInsumoStatusModal } from './components/TipoInsumoStatusModal.tsx';
import { TipoInsumoDeleteModal } from './components/TipoInsumoDeleteModal.tsx';
import { ToastContainer } from '../../shared/components/ToastContainer.tsx';

export const TiposInsumoFeature: React.FC = () => {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedTipoInsumo, setSelectedTipoInsumo] = useState<TipoInsumo | null>(null);

  // List Data State
  const [tiposInsumo, setTiposInsumo] = useState<TipoInsumo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State (Defaulting to 'ativos')
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ativos');
  const [sortBy, setSortBy] = useState<'id' | 'nome' | 'ativo' | 'createdAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Action Modals State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [itemForStatusChange, setItemForStatusChange] = useState<TipoInsumo | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TipoInsumo | null>(null);

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

  // Fetch list data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await TipoInsumoApiService.list({
        search: searchTerm,
        status: statusFilter,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      });

      setTiposInsumo(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error('Failed to load tipos de insumo:', err);
      setError(err?.message || 'Falha ao carregar tipos de insumo. Verifique a conexão.');
      addToast('error', err?.message || 'Erro ao carregar tipos de insumo', 'Erro');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for List
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (column: 'id' | 'nome' | 'ativo' | 'createdAt') => {
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
    setSelectedTipoInsumo(null);
    setViewMode('create');
  };

  const handleEdit = (item: TipoInsumo) => {
    setSelectedTipoInsumo(item);
    setViewMode('edit');
  };

  const handlePromptToggleStatus = (item: TipoInsumo) => {
    setItemForStatusChange(item);
  };

  const handleDeletePrompt = (item: TipoInsumo) => {
    setItemToDelete(item);
  };

  // Save Form (Create / Update)
  const handleSaveForm = async (formData: TipoInsumoFormData) => {
    setIsSaving(true);
    try {
      if (viewMode === 'edit' && selectedTipoInsumo) {
        await TipoInsumoApiService.update(selectedTipoInsumo.id, formData);
        addToast('success', `Tipo de insumo "${formData.nome}" atualizado com sucesso!`, 'Sucesso');
      } else {
        await TipoInsumoApiService.create(formData);
        addToast('success', `Tipo de insumo "${formData.nome}" cadastrado com sucesso!`, 'Sucesso');
      }

      setViewMode('list');
      setSelectedTipoInsumo(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save tipo de insumo:', err);
      addToast('error', err?.message || 'Falha ao salvar o tipo de insumo.', 'Erro');
      throw err; // Re-throw to allow form component to show inline errors
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Status Toggle (Ativar / Inativar)
  const handleConfirmToggleStatus = async () => {
    if (!itemForStatusChange) return;

    setIsUpdatingStatus(true);
    try {
      const nextStatus = !itemForStatusChange.ativo;
      await TipoInsumoApiService.toggleStatus(itemForStatusChange.id, nextStatus);

      addToast(
        'success',
        `Tipo de insumo "${itemForStatusChange.nome}" ${nextStatus ? 'ativado' : 'inativado'} com sucesso!`,
        'Status Atualizado'
      );
      setItemForStatusChange(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to toggle status of tipo de insumo:', err);
      addToast('error', err?.message || 'Não foi possível alterar o status do registro.', 'Erro');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Confirm Physical Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await TipoInsumoApiService.delete(itemToDelete.id);
      addToast('success', `Tipo de insumo "${itemToDelete.nome}" excluído com sucesso!`, 'Sucesso');
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete tipo de insumo:', err);
      addToast('error', err?.message || 'Não foi possível excluir o registro.', 'Erro');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main View Router */}
      {viewMode === 'list' && (
        <TipoInsumoList
          tiposInsumo={tiposInsumo}
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onNew={handleNew}
          onEdit={handleEdit}
          onToggleStatus={handlePromptToggleStatus}
          onDelete={handleDeletePrompt}
          onRefresh={loadData}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <TipoInsumoForm
          tipoInsumo={selectedTipoInsumo}
          onSave={handleSaveForm}
          onCancel={() => {
            setViewMode('list');
            setSelectedTipoInsumo(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Status Toggle Modal */}
      <TipoInsumoStatusModal
        isOpen={Boolean(itemForStatusChange)}
        onClose={() => setItemForStatusChange(null)}
        onConfirm={handleConfirmToggleStatus}
        tipoInsumo={itemForStatusChange}
        isUpdating={isUpdatingStatus}
      />

      {/* Delete Confirmation Modal */}
      <TipoInsumoDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        tipoInsumo={itemToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
