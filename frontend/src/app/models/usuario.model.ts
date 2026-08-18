export type PapelGrupo = 'secretaria' | 'tesouraria';

export interface GrupoVinculo {
  GrupoId: number;
  Nome: string;
  CSA: number;
  CSA_Nome: string;
  Papel: PapelGrupo;
  Ativo: boolean;
}

export interface Usuario {
  Id: number;
  Nome: string;
  Email: string;
  OnboardingCompleto?: boolean;
  Grupos?: GrupoVinculo[];
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
  message?: string;
}

export interface OnboardingRequest {
  Vinculos: { GrupoId: number; Papel: PapelGrupo }[];
  NovosGrupos: {
    Nome: string;
    Endereco: string;
    CSA: number;
    Papeis?: PapelGrupo[];
    Papel?: PapelGrupo;
  }[];
}

export interface OnboardingResponse {
  message: string;
  OnboardingCompleto: boolean;
  Grupos: GrupoVinculo[];
  usuario: Usuario;
}

export interface EncerrarEncargoResponse {
  message: string;
  Encerrados: number;
  usuario: Usuario;
}

export interface EncargoPreenchidoError {
  message: string;
  error: 'encargo_preenchido';
  GrupoId: number;
  Papel: PapelGrupo;
  UsuarioAtivo: { Id: number; Nome: string };
}
