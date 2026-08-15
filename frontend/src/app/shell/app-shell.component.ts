import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly usuario$ = this.auth.usuario$;
  readonly onboardingComplete$ = this.auth.usuario$.pipe(
    map((usuario) => usuario?.OnboardingCompleto === true)
  );

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.carregarUsuarioAtual().subscribe();
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
