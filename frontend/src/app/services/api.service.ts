import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Altere esta URL para o domínio de produção quando fizer o deploy
//const API_URL = 'http://localhost/tesoureiro/api'; // Para desenvolvimento local
const API_URL = 'https://williamsantos82.free.nf/api';

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
  getReunioes(filtros?: { idGrupo?: number, mes?: number, ano?: number }): Observable<any> {
    let url = `${API_URL}/reuniao/`;
    const params: string[] = [];
    
    if (filtros) {
      if (filtros.idGrupo) {
        params.push(`IdGrupo=${filtros.idGrupo}`);
      }
      if (filtros.mes) {
        params.push(`mes=${filtros.mes}`);
      }
      if (filtros.ano) {
        params.push(`ano=${filtros.ano}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
    }
    
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

  // Métodos para CSA
  getCSAs(): Observable<any> {
    return this.http.get(`${API_URL}/csa/`);
  }

  // Métodos para Despesas
  getDespesas(idReuniao?: number): Observable<any> {
    const url = idReuniao ? `${API_URL}/despesas/?IdReuniao=${idReuniao}` : `${API_URL}/despesas/`;
    return this.http.get(url);
  }

  getDespesa(id: number): Observable<any> {
    return this.http.get(`${API_URL}/despesas/?id=${id}`);
  }

  createDespesa(despesa: any): Observable<any> {
    return this.http.post(`${API_URL}/despesas/`, despesa);
  }

  updateDespesa(despesa: any): Observable<any> {
    return this.http.put(`${API_URL}/despesas/`, despesa);
  }

  deleteDespesa(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/despesas/?id=${id}`);
  }

  // Métodos para Relatórios
  getRelatorio(tipo: string, idGrupo: number, mes: number, ano: number): Observable<any> {
    return this.http.get(`${API_URL}/relatorios/?tipo=${tipo}&IdGrupo=${idGrupo}&mes=${mes}&ano=${ano}`);
  }
}
