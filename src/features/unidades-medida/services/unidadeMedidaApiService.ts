import { UnidadeMedida, UnidadeMedidaFormData, PaginatedResponse } from '../../../core/types.ts';

export interface ListParams {
  search?: string;
  tipo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const UnidadeMedidaApiService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<UnidadeMedida>> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.tipo && params.tipo !== 'todos') searchParams.append('tipo', params.tipo);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const res = await fetch(`/api/unidades-medida?${searchParams.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Erro ${res.status}: Falha ao buscar unidades de medida`);
    }

    return res.json();
  },

  async getById(id: number): Promise<UnidadeMedida> {
    const res = await fetch(`/api/unidades-medida/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Erro ${res.status}: Registro não encontrado`);
    }

    return res.json();
  },

  async create(data: UnidadeMedidaFormData): Promise<UnidadeMedida> {
    const res = await fetch('/api/unidades-medida', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        nome: data.nome.trim(),
        tipo: data.tipo,
        fatorConversao: typeof data.fatorConversao === 'string' ? parseFloat(data.fatorConversao) : data.fatorConversao,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const detailedMsg = errData.details ? Object.values(errData.details).join(', ') : errData.message || errData.error;
      throw new Error(detailedMsg || `Erro ${res.status}: Falha ao salvar unidade de medida`);
    }

    return res.json();
  },

  async update(id: number, data: UnidadeMedidaFormData): Promise<UnidadeMedida> {
    const res = await fetch(`/api/unidades-medida/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        nome: data.nome.trim(),
        tipo: data.tipo,
        fatorConversao: typeof data.fatorConversao === 'string' ? parseFloat(data.fatorConversao) : data.fatorConversao,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const detailedMsg = errData.details ? Object.values(errData.details).join(', ') : errData.message || errData.error;
      throw new Error(detailedMsg || `Erro ${res.status}: Falha ao atualizar unidade de medida`);
    }

    return res.json();
  },

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/unidades-medida/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Erro ${res.status}: Falha ao excluir unidade de medida`);
    }

    return res.json();
  },
};
