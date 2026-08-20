import React, { useState, useEffect, useCallback } from 'react';
import { Insumo, InsumoFormData, ToastMessage } from '../../core/types.ts';
import { InsumoApiService } from './services/insumoApiService.ts';
import { InsumoList } from './components/InsumoList.tsx';
import { InsumoForm } from './components/InsumoForm.tsx';
import { InsumoStatusModal } from './components/InsumoStatusModal.tsx';
import { InsumoDeleteModal } from './components/InsumoDeleteModal.tsx';
import { ToastContainer } from '../../shared/components/ToastContainer.tsx';

export const InsumosFeature: React.FC = () => {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);

  // List Data State
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State (Defaulting to 'ativos')
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ativos');
  const [sortBy, setSortBy] = useState<
    | 'id'
    | 'nome'
    | 'custoUnitarioBase'
    | 'quantidadeEstoque'
    | 'estoqueMinimo'
    | 'ativo'
    | 'createdAt'
  >('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Action Modals State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [itemForStatusChange, setItemForStatusChange] = useState<Insumo | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Insumo | null>(null);

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
      const response = await InsumoApiService.list({
        search: searchTerm,
        status: statusFilter,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      });

      setInsumos(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error('Failed to load insumos:', err);
      setError(err?.message || 'Falha ao carregar insumos. Verifique a conexão.');
      addToast('error', err?.message || 'Erro ao carregar insumos', 'Erro');
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

  const handleSortChange = (
    column:
      | 'id'
      | 'nome'
      | 'custoUnitarioBase'
      | 'quantidadeEstoque'
      | 'estoqueMinimo'
      | 'ativo'
      | 'createdAt'
  ) => {
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
    setSelectedInsumo(null);
    setViewMode('create');
  };

  const handleEdit = (item: Insumo) => {
    setSelectedInsumo(item);
    setViewMode('edit');
  };

  const handlePromptToggleStatus = (item: Insumo) => {
    setItemForStatusChange(item);
  };

  const handleDeletePrompt = (item: Insumo) => {
    setItemToDelete(item);
  };

  // Save Form (Create / Update)
  const handleSaveForm = async (formData: InsumoFormData) => {
    setIsSaving(true);
    try {
      if (viewMode === 'edit' && selectedInsumo) {
        await InsumoApiService.update(selectedInsumo.id, formData);
        addToast('success', `Insumo "${formData.nome}" atualizado com sucesso!`, 'Sucesso');
      } else {
        await InsumoApiService.create(formData);
        addToast('success', `Insumo "${formData.nome}" cadastrado com sucesso!`, 'Sucesso');
      }

      setViewMode('list');
      setSelectedInsumo(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save insumo:', err);
      addToast('error', err?.message || 'Falha ao salvar o insumo.', 'Erro');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Status Toggle
  const handleConfirmToggleStatus = async () => {
    if (!itemForStatusChange) return;

    setIsUpdatingStatus(true);
    try {
      const nextStatus = !itemForStatusChange.ativo;
      await InsumoApiService.toggleStatus(itemForStatusChange.id, nextStatus);

      addToast(
        'success',
        `Insumo "${itemForStatusChange.nome}" ${nextStatus ? 'ativado' : 'inativado'} com sucesso!`,
        'Status Atualizado'
      );
      setItemForStatusChange(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to toggle status of insumo:', err);
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
      await InsumoApiService.delete(itemToDelete.id);
      addToast('success', `Insumo "${itemToDelete.nome}" excluído com sucesso!`, 'Sucesso');
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete insumo:', err);
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
        <InsumoList
          insumos={insumos}
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
        <InsumoForm
          insumo={selectedInsumo}
          onSave={handleSaveForm}
          onCancel={() => {
            setViewMode('list');
            setSelectedInsumo(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Status Toggle Modal */}
      <InsumoStatusModal
        isOpen={Boolean(itemForStatusChange)}
        onClose={() => setItemForStatusChange(null)}
        onConfirm={handleConfirmToggleStatus}
        insumo={itemForStatusChange}
        isUpdating={isUpdatingStatus}
      />

      {/* Delete Confirmation Modal */}
      <InsumoDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        insumo={itemToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
