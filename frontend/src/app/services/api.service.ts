import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CsaOption, CsaSearchResponse } from '../models/csa.model';
import { GrupoListFiltros, GrupoListItem, GrupoListResponse } from '../models/grupo.model';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Métodos para Grupo
  getGrupos(): Observable<GrupoListItem[]> {
    return this.http.get<GrupoListItem[]>(`${API_URL}/grupo/`);
  }

  getGruposPaginados(filtros: GrupoListFiltros): Observable<GrupoListResponse> {
    const params: string[] = [];

    if (filtros.csa) {
      params.push(`CSA=${filtros.csa}`);
    }
    if (filtros.busca) {
      params.push(`busca=${encodeURIComponent(filtros.busca)}`);
    }
    if (filtros.limit) {
      params.push(`limit=${filtros.limit}`);
    }
    if (filtros.offset !== undefined) {
      params.push(`offset=${filtros.offset}`);
    }
    if (filtros.disponiveis) {
      params.push('disponiveis=1');
    }

    const query = params.length > 0 ? `?${params.join('&')}` : '';

    return this.http.get<GrupoListResponse>(`${API_URL}/grupo/${query}`);
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
  buscarCSAs(q: string, limit = 20): Observable<CsaSearchResponse> {
    return this.http.get<CsaSearchResponse>(
      `${API_URL}/csa/?q=${encodeURIComponent(q)}&limit=${limit}`
    );
  }

  getCSA(id: number): Observable<CsaOption> {
    return this.http.get<CsaSearchResponse>(`${API_URL}/csa/?id=${id}`).pipe(
      map((res) => res.items[0])
    );
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

  // Método para obter saldo acumulado
  getSaldoAcumulado(idGrupo: number, mes: number, ano: number): Observable<any> {
    return this.http.get(`${API_URL}/relatorios/?tipo=saldo-acumulado&IdGrupo=${idGrupo}&mes=${mes}&ano=${ano}`);
  }
}
