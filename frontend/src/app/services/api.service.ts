import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Altere esta URL para o domínio de produção quando fizer o deploy
const API_URL = 'http://localhost/tesoureiro/api'; // Para desenvolvimento local
//const API_URL = 'https://williamsantos82.free.nf/api';

// Se tiver problemas com 301 (redirecionamento), use index.php explicitamente:
// Exemplo: `${API_URL}/grupo/index.php`

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Métodos para Grupo
  getGrupos(): Observable<any> {
    return this.http.get(`${API_URL}/grupo/`);
  }

  getGrupo(id: number): Observable<any> {
    return this.http.get(`${API_URL}/grupo/?id=${id}`);
  }

  createGrupo(grupo: any): Observable<any> {
    return this.http.post(`${API_URL}/grupo/`, grupo);
  }

  updateGrupo(grupo: any): Observable<any> {
    return this.http.put(`${API_URL}/grupo/`, grupo);
  }

  deleteGrupo(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/grupo/?id=${id}`);
  }

  // Métodos para Reunião
  getReunioes(idGrupo?: number): Observable<any> {
    const url = idGrupo ? `${API_URL}/reuniao/?IdGrupo=${idGrupo}` : `${API_URL}/reuniao/`;
    return this.http.get(url);
  }

  getReuniao(id: number): Observable<any> {
    return this.http.get(`${API_URL}/reuniao/?id=${id}`);
  }

  createReuniao(reuniao: any): Observable<any> {
    return this.http.post(`${API_URL}/reuniao/`, reuniao);
  }

  updateReuniao(reuniao: any): Observable<any> {
    return this.http.put(`${API_URL}/reuniao/`, reuniao);
  }

  deleteReuniao(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/reuniao/?id=${id}`);
  }
}
