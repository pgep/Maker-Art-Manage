import { Insumo, InsumoFormData, PaginatedResponse, UnidadeMedida, TipoInsumo } from '../../../core/types.ts';

export interface InsumoListParams {
  search?: string;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?:
    | 'id'
    | 'nome'
    | 'custoUnitarioBase'
    | 'quantidadeEstoque'
    | 'estoqueMinimo'
    | 'ativo'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class InsumoApiService {
  private static BASE_URL = '/api/insumos';

  static async list(params: InsumoListParams = {}): Promise<PaginatedResponse<Insumo>> {
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
      throw new Error(errorData.error || errorData.message || 'Falha ao buscar insumos.');
    }

    return response.json();
  }

  static async getById(id: number): Promise<Insumo> {
    const response = await fetch(`${this.BASE_URL}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Insumo ID ${id} não encontrado.`);
    }

    return response.json();
  }

  static async create(data: InsumoFormData): Promise<Insumo> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || 'Erro ao cadastrar insumo.';
      const error: any = new Error(message);
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  static async update(id: number, data: InsumoFormData): Promise<Insumo> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || 'Erro ao atualizar insumo.';
      const error: any = new Error(message);
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  static async toggleStatus(id: number, ativo?: boolean): Promise<Insumo> {
    const response = await fetch(`${this.BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ativo !== undefined ? { ativo } : {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Falha ao alterar status do insumo.');
    }

    return response.json();
  }

  static async delete(id: number): Promise<{ success: boolean; message: string; id: number }> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Erro ao excluir insumo.');
    }

    return response.json();
  }

  // Helper to load active Unidades de Medida
  static async loadActiveUnidadesMedida(): Promise<UnidadeMedida[]> {
    const response = await fetch('/api/unidades-medida?pageSize=100');
    if (!response.ok) {
      throw new Error('Falha ao carregar lista de unidades de medida.');
    }
    const data = await response.json();
    return data.data || [];
  }

  // Helper to load active Tipos de Insumo
  static async loadActiveTiposInsumo(): Promise<TipoInsumo[]> {
    const response = await fetch('/api/tipos-insumo?status=ativos&pageSize=100');
    if (!response.ok) {
      throw new Error('Falha ao carregar lista de tipos de insumo.');
    }
    const data = await response.json();
    return data.data || [];
  }
}
