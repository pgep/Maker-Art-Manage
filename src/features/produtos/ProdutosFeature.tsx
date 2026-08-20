import React, { useState, useEffect, useCallback } from 'react';
import {
  Produto,
  ProdutoDetail,
  ProdutoFormData,
  TipoProduto,
  ToastMessage,
} from '../../core/types.ts';
import { ProdutoApiService } from './services/produtoApiService.ts';
import { ProdutoList } from './components/ProdutoList.tsx';
import { ProdutoForm } from './components/ProdutoForm.tsx';
import { ProdutoDetailModal } from './components/ProdutoDetailModal.tsx';
import { ProdutoStatusModal } from './components/ProdutoStatusModal.tsx';
import { ProdutoDeleteModal } from './components/ProdutoDeleteModal.tsx';
import { ToastContainer } from '../../shared/components/ToastContainer.tsx';

export const ProdutosFeature: React.FC = () => {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProdutoDetail, setSelectedProdutoDetail] = useState<ProdutoDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // List Data State
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tipos de Produto for filter
  const [tiposProdutoList, setTiposProdutoList] = useState<TipoProduto[]>([]);

  // Filter & Sort State (Defaulting to 'ativos')
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tipoProdutoFilter, setTipoProdutoFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('ativos');
  const [sortBy, setSortBy] = useState<
    'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'precoVenda' | 'ativo' | 'createdAt'
  >('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Action Modals State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [itemForDetail, setItemForDetail] = useState<Produto | null>(null);
  const [itemForStatusChange, setItemForStatusChange] = useState<Produto | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Produto | null>(null);

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

  // Load auxiliary TiposProduto for filter
  useEffect(() => {
    ProdutoApiService.loadActiveTiposProduto()
      .then((tipos) => setTiposProdutoList(tipos))
      .catch((err) => console.error('Failed to load tipos produto for filter:', err));
  }, []);

  // Fetch list data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ProdutoApiService.list({
        search: searchTerm,
        tipoProdutoId: tipoProdutoFilter,
        status: statusFilter,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      });

      setProdutos(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error('Failed to load produtos:', err);
      setError(err?.message || 'Falha ao carregar produtos. Verifique a conexão.');
      addToast('error', err?.message || 'Erro ao carregar produtos', 'Erro');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, tipoProdutoFilter, statusFilter, currentPage, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for List
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTipoProdutoFilterChange = (value?: number) => {
    setTipoProdutoFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (
    column: 'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'ativo' | 'createdAt'
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
    setSelectedProdutoDetail(null);
    setViewMode('create');
  };

  const handleView = (produto: Produto) => {
    setItemForDetail(produto);
  };

  const handleEdit = async (produto: Produto) => {
    setIsLoadingDetail(true);
    try {
      const fullDetail = await ProdutoApiService.getById(produto.id);
      setSelectedProdutoDetail(fullDetail);
      setViewMode('edit');
    } catch (err: any) {
      console.error('Failed to load product detail for edit:', err);
      addToast('error', err?.message || 'Erro ao carregar dados do produto para edição.', 'Erro');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handlePromptToggleStatus = (produto: Produto) => {
    setItemForStatusChange(produto);
  };

  const handleDeletePrompt = (produto: Produto) => {
    setItemToDelete(produto);
  };

  // Save Form (Create / Update)
  const handleSaveForm = async (formData: ProdutoFormData) => {
    setIsSaving(true);
    try {
      if (viewMode === 'edit' && selectedProdutoDetail) {
        await ProdutoApiService.update(selectedProdutoDetail.id, formData);
        addToast('success', `Produto "${formData.nome}" atualizado com sucesso!`, 'Sucesso');
      } else {
        await ProdutoApiService.create(formData);
        addToast('success', `Produto "${formData.nome}" cadastrado com sucesso!`, 'Sucesso');
      }

      setViewMode('list');
      setSelectedProdutoDetail(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save produto:', err);
      addToast('error', err?.message || 'Falha ao salvar o produto.', 'Erro');
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
      await ProdutoApiService.toggleStatus(itemForStatusChange.id, nextStatus);

      addToast(
        'success',
        `Produto "${itemForStatusChange.nome}" ${nextStatus ? 'ativado' : 'inativado'} com sucesso!`,
        'Status Atualizado'
      );
      setItemForStatusChange(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to toggle status of produto:', err);
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
      await ProdutoApiService.delete(itemToDelete.id);
      addToast('success', `Produto "${itemToDelete.nome}" excluído com sucesso!`, 'Sucesso');
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete produto:', err);
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
        <ProdutoList
          produtos={produtos}
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading || isLoadingDetail}
          error={error}
          searchTerm={searchTerm}
          tipoProdutoFilter={tipoProdutoFilter}
          statusFilter={statusFilter}
          tiposProdutoList={tiposProdutoList}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={handleSearchChange}
          onTipoProdutoFilterChange={handleTipoProdutoFilterChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onNew={handleNew}
          onView={handleView}
          onEdit={handleEdit}
          onToggleStatus={handlePromptToggleStatus}
          onDelete={handleDeletePrompt}
          onRefresh={loadData}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <ProdutoForm
          produto={selectedProdutoDetail}
          onSave={handleSaveForm}
          onCancel={() => {
            setViewMode('list');
            setSelectedProdutoDetail(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Product Detail Modal */}
      <ProdutoDetailModal
        isOpen={Boolean(itemForDetail)}
        onClose={() => setItemForDetail(null)}
        produto={itemForDetail}
        onEdit={(prod) => {
          setItemForDetail(null);
          handleEdit(prod);
        }}
      />

      {/* Status Toggle Modal */}
      <ProdutoStatusModal
        isOpen={Boolean(itemForStatusChange)}
        onClose={() => setItemForStatusChange(null)}
        onConfirm={handleConfirmToggleStatus}
        produto={itemForStatusChange}
        isUpdating={isUpdatingStatus}
      />

      {/* Delete Confirmation Modal */}
      <ProdutoDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        produto={itemToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
