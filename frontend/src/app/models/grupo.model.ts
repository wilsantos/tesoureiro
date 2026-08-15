export interface GrupoListItem {
  Id: number;
  Nome: string;
  Endereco?: string;
  CSA: number;
  CSA_Nome: string;
}

export interface GrupoListResponse {
  items: GrupoListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface GrupoListFiltros {
  csa?: number;
  busca?: string;
  limit?: number;
  offset?: number;
  disponiveis?: boolean;
}
