import {
  Produto,
  ProdutoDetail,
  ProdutoFormData,
  PaginatedResponse,
  TipoProduto,
  Markup,
  Insumo,
} from '../../../core/types.ts';

export interface ProdutoListParams {
  search?: string;
  tipoProdutoId?: number;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'precoVenda' | 'ativo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class ProdutoApiService {
  private static BASE_URL = '/api/produtos';

  static async list(params: ProdutoListParams = {}): Promise<PaginatedResponse<Produto>> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.tipoProdutoId) query.append('tipoProdutoId', params.tipoProdutoId.toString());
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const url = queryString ? `${this.BASE_URL}?${queryString}` : this.BASE_URL;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Falha ao buscar produtos.');
    }

    return response.json();
  }

  static async getById(id: number): Promise<ProdutoDetail> {
    const response = await fetch(`${this.BASE_URL}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Produto ID ${id} não encontrado.`);
    }

    return response.json();
  }

  static async create(data: ProdutoFormData): Promise<ProdutoDetail> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || 'Erro ao cadastrar produto.';
      const error: any = new Error(message);
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  static async update(id: number, data: ProdutoFormData): Promise<ProdutoDetail> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || 'Erro ao atualizar produto.';
      const error: any = new Error(message);
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  static async toggleStatus(id: number, ativo?: boolean): Promise<Produto> {
    const response = await fetch(`${this.BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ativo !== undefined ? { ativo } : {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Falha ao alterar status do produto.');
    }

    return response.json();
  }

  static async delete(id: number): Promise<{ success: boolean; message: string; id: number }> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Erro ao excluir produto.');
    }

    return response.json();
  }

  // Helpers for dropdowns and auxiliary data
  static async loadActiveTiposProduto(): Promise<TipoProduto[]> {
    const response = await fetch('/api/tipos-produto?status=ativos&pageSize=100');
    if (!response.ok) {
      throw new Error('Falha ao carregar tipos de produto.');
    }
    const data = await response.json();
    return data.data || [];
  }

  static async loadActiveMarkups(): Promise<Markup[]> {
    const response = await fetch('/api/markups?status=ativos&pageSize=100');
    if (!response.ok) {
      throw new Error('Falha ao carregar markups.');
    }
    const data = await response.json();
    return data.data || [];
  }

  static async loadActiveInsumos(): Promise<Insumo[]> {
    const response = await fetch('/api/insumos?status=ativos&pageSize=200');
    if (!response.ok) {
      throw new Error('Falha ao carregar insumos.');
    }
    const data = await response.json();
    return data.data || [];
  }
}
