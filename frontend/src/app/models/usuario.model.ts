export interface Usuario {
  Id: number;
  Nome: string;
  Email: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
  message?: string;
}
