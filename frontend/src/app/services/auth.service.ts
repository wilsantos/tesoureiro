import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  EncerrarEncargoResponse,
  OnboardingRequest,
  OnboardingResponse,
  Usuario
} from '../models/usuario.model';

const TOKEN_KEY = 'na_token';
const USUARIO_KEY = 'na_usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(this.loadUsuarioFromStorage());

  readonly usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone
  ) {}

  cadastrar(nome: string, email: string, senha: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/cadastro`, {
      Nome: nome,
      Email: email,
      Senha: senha
    }).pipe(tap((res) => this.setSession(res)));
  }

  login(email: string, senha: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
      Email: email,
      Senha: senha
    }).pipe(tap((res) => this.setSession(res)));
  }

  loginGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/google`, {
      idToken
    }).pipe(tap((res) => this.setSession(res)));
  }

  completarOnboarding(body: OnboardingRequest): Observable<OnboardingResponse> {
    return this.http.post<OnboardingResponse>(`${environment.apiUrl}/auth/onboarding`, body).pipe(
      tap((res) => {
        if (res.usuario) {
          this.persistUsuario(res.usuario);
        } else {
          const atual = this.getUsuario();
          if (atual) {
            this.persistUsuario({
              ...atual,
              OnboardingCompleto: res.OnboardingCompleto,
              Grupos: res.Grupos
            });
          }
        }
      })
    );
  }

  encerrarEncargos(grupoId: number): Observable<EncerrarEncargoResponse> {
    return this.http.post<EncerrarEncargoResponse>(
      `${environment.apiUrl}/auth/encerrar-encargo`,
      { GrupoId: grupoId }
    ).pipe(tap((res) => {
      if (res.usuario) {
        this.persistUsuario(res.usuario);
      }
    }));
  }

  logout(): void {
    this.ngZone.run(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
      this.usuarioSubject.next(null);
      this.router.navigate(['/login']);
    });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isOnboardingComplete(): boolean {
    return this.getUsuario()?.OnboardingCompleto === true;
  }

  carregarUsuarioAtual(): Observable<Usuario> {
    return this.http.get<Usuario>(`${environment.apiUrl}/auth/me`).pipe(
      tap((usuario) => this.persistUsuario(usuario))
    );
  }

  navigateAfterAuth(): void {
    this.carregarUsuarioAtual().subscribe({
      next: (usuario) => {
        if (usuario.OnboardingCompleto) {
          this.router.navigate(['/app/grupos']);
        } else {
          this.router.navigate(['/app/cadastro']);
        }
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  private setSession(res: AuthResponse): void {
    this.ngZone.run(() => {
      localStorage.setItem(TOKEN_KEY, res.token);
      this.persistUsuario(res.usuario);
    });
  }

  private persistUsuario(usuario: Usuario): void {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  private loadUsuarioFromStorage(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}
