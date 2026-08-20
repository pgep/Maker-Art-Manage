import React, { useState, useEffect, useCallback } from 'react';
import { Markup, MarkupFormData, ToastMessage } from '../../core/types.ts';
import { MarkupApiService } from './services/markupApiService.ts';
import { MarkupList } from './components/MarkupList.tsx';
import { MarkupForm } from './components/MarkupForm.tsx';
import { MarkupStatusModal } from './components/MarkupStatusModal.tsx';
import { MarkupDeleteModal } from './components/MarkupDeleteModal.tsx';
import { ToastContainer } from '../../shared/components/ToastContainer.tsx';

export const MarkupsFeature: React.FC = () => {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedMarkup, setSelectedMarkup] = useState<Markup | null>(null);

  // List Data State
  const [markups, setMarkups] = useState<Markup[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State (Defaulting to 'ativos')
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ativos');
  const [sortBy, setSortBy] = useState<'id' | 'nome' | 'fator' | 'ativo' | 'createdAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Action Modals State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [itemForStatusChange, setItemForStatusChange] = useState<Markup | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Markup | null>(null);

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
      const response = await MarkupApiService.list({
        search: searchTerm,
        status: statusFilter,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      });

      setMarkups(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error('Failed to load markups:', err);
      setError(err?.message || 'Falha ao carregar markups. Verifique a conexão.');
      addToast('error', err?.message || 'Erro ao carregar markups', 'Erro');
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

  const handleSortChange = (column: 'id' | 'nome' | 'fator' | 'ativo' | 'createdAt') => {
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
    setSelectedMarkup(null);
    setViewMode('create');
  };

  const handleEdit = (item: Markup) => {
    setSelectedMarkup(item);
    setViewMode('edit');
  };

  const handlePromptToggleStatus = (item: Markup) => {
    setItemForStatusChange(item);
  };

  const handleDeletePrompt = (item: Markup) => {
    setItemToDelete(item);
  };

  // Save Form (Create / Update)
  const handleSaveForm = async (formData: MarkupFormData) => {
    setIsSaving(true);
    try {
      if (viewMode === 'edit' && selectedMarkup) {
        await MarkupApiService.update(selectedMarkup.id, formData);
        addToast('success', `Markup "${formData.nome}" atualizado com sucesso!`, 'Sucesso');
      } else {
        await MarkupApiService.create(formData);
        addToast('success', `Markup "${formData.nome}" cadastrado com sucesso!`, 'Sucesso');
      }

      setViewMode('list');
      setSelectedMarkup(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save markup:', err);
      addToast('error', err?.message || 'Falha ao salvar o markup.', 'Erro');
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
      await MarkupApiService.toggleStatus(itemForStatusChange.id, nextStatus);

      addToast(
        'success',
        `Markup "${itemForStatusChange.nome}" ${nextStatus ? 'ativado' : 'inativado'} com sucesso!`,
        'Status Atualizado'
      );
      setItemForStatusChange(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to toggle status of markup:', err);
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
      await MarkupApiService.delete(itemToDelete.id);
      addToast('success', `Markup "${itemToDelete.nome}" excluído com sucesso!`, 'Sucesso');
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete markup:', err);
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
        <MarkupList
          markups={markups}
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
        <MarkupForm
          markup={selectedMarkup}
          onSave={handleSaveForm}
          onCancel={() => {
            setViewMode('list');
            setSelectedMarkup(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Status Toggle Modal */}
      <MarkupStatusModal
        isOpen={Boolean(itemForStatusChange)}
        onClose={() => setItemForStatusChange(null)}
        onConfirm={handleConfirmToggleStatus}
        markup={itemForStatusChange}
        isUpdating={isUpdatingStatus}
      />

      {/* Delete Confirmation Modal */}
      <MarkupDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        markup={itemToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
