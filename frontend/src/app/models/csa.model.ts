export interface CsaOption {
  Id: number;
  Nome: string;
  CSR: number | null;
  CSR_Nome: string | null;
  Label: string;
}

export interface CsaSearchResponse {
  items: CsaOption[];
  total: number;
  limit: number;
}
