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

export interface TipoProduto {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TipoProdutoFormData {
  nome: string;
  ativo?: boolean;
}

export interface TipoInsumo {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TipoInsumoFormData {
  nome: string;
  ativo?: boolean;
}

export interface Insumo {
  id: number;
  nome: string;
  tipoInsumoId: number;
  unidadeMedidaId: number;
  quantidadeCompra: number;
  valorCompra: number;
  quantidadeBase: number;
  custoUnitarioBase: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relational details for display and calculations
  tipoInsumoNome?: string;
  unidadeMedidaNome?: string;
  unidadeMedidaTipo?: TipoUnidade;
  fatorConversao?: number;
}

export interface InsumoFormData {
  nome: string;
  tipoInsumoId: number | string;
  unidadeMedidaId: number | string;
  quantidadeCompra: number | string;
  valorCompra: number | string;
  estoqueMinimo: number | string;
  ativo?: boolean;
}

export interface Markup {
  id: number;
  nome: string;
  fator: number | string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupFormData {
  nome: string;
  fator: number | string;
  ativo?: boolean;
}

export interface ProdutoInsumoDetail {
  id: number;
  produtoId: number;
  insumoId: number;
  quantidade: number;
  custoUnitarioBase: number;
  custoComponente: number;
  insumoNome: string;
  insumoAtivo: boolean;
  unidadeMedidaNome: string;
  unidadeMedidaTipo: string;
  fatorConversao: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string | null;
  tipoProdutoId: number;
  markupId: number;
  custoTotal: number;
  precoSugerido: number;
  precoVenda: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  tipoProdutoNome?: string;
  markupNome?: string;
  markupFator?: number;
  totalItensComposicao?: number;
}

export interface ProdutoDetail extends Produto {
  itensComposicao: ProdutoInsumoDetail[];
}

export interface ProdutoInsumoInput {
  insumoId: number | string;
  quantidade: number | string;
}

export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  tipoProdutoId: number | string;
  markupId: number | string;
  precoVenda: number | string;
  ativo?: boolean;
  itensComposicao: ProdutoInsumoInput[];
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
