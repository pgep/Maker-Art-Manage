import { TipoInsumo, TipoInsumoFormData, PaginatedResponse } from '../../../core/types.ts';

export interface TipoInsumoListParams {
  search?: string;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'ativo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class TipoInsumoApiService {
  private static BASE_URL = '/api/tipos-insumo';

  static async list(params: TipoInsumoListParams = {}): Promise<PaginatedResponse<TipoInsumo>> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
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
      throw new Error(errorData.error || errorData.message || 'Falha ao buscar tipos de insumo.');
    }

    return response.json();
  }

  static async getById(id: number): Promise<TipoInsumo> {
    const response = await fetch(`${this.BASE_URL}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Tipo de insumo ID ${id} não encontrado.`);
    }

    return response.json();
  }

  static async create(data: TipoInsumoFormData): Promise<TipoInsumo> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || 'Erro ao criar tipo de insumo.';
      const error: any = new Error(message);
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  static async update(id: number, data: TipoInsumoFormData): Promise<TipoInsumo> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || 'Erro ao atualizar tipo de insumo.';
      const error: any = new Error(message);
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  static async toggleStatus(id: number, ativo?: boolean): Promise<TipoInsumo> {
    const response = await fetch(`${this.BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ativo !== undefined ? { ativo } : {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Falha ao alterar status do tipo de insumo.');
    }

    return response.json();
  }

  static async delete(id: number): Promise<{ success: boolean; message: string; id: number }> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Erro ao excluir tipo de insumo.');
    }

    return response.json();
  }
}
