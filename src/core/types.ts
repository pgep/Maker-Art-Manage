export type TipoUnidade = 'Volume' | 'Comprimento' | 'Massa' | 'Unidade';

export interface UnidadeMedida {
  id: number;
  nome: string;
  tipo: TipoUnidade;
  fatorConversao: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnidadeMedidaFormData {
  nome: string;
  tipo: TipoUnidade;
  fatorConversao: number | string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponseError {
  error: string;
  message?: string;
  details?: Record<string, string>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
