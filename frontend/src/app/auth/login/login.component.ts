import { Component, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButton', { static: false }) googleButton?: ElementRef<HTMLDivElement>;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly googleClientId = environment.googleClientId;
  errorMessage = '';
  isSubmitting = false;
  showSenha = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngAfterViewInit(): void {
    if (this.googleClientId) {
      this.loadGoogleScript()
        .then(() => this.initGoogleButton())
        .catch(() => {
          this.errorMessage = 'Não foi possível carregar o login do Google.';
        });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const { email, senha } = this.form.getRawValue();

    this.auth.login(email!, senha!).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.auth.navigateAfterAuth();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Não foi possível entrar. Verifique suas credenciais.';
      }
    });
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject());
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private initGoogleButton(): void {
    const parent = this.googleButton?.nativeElement;
    if (!parent || !window.google?.accounts?.id || !this.googleClientId) {
      return;
    }

    parent.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response) => {
        this.ngZone.run(() => this.handleGoogleCredential(response.credential));
      }
    });

    window.google.accounts.id.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: 320
    });
  }

  private handleGoogleCredential(credential: string): void {
    this.errorMessage = '';
    this.isSubmitting = true;

    this.auth.loginGoogle(credential).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.auth.navigateAfterAuth();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Não foi possível entrar com o Google.';
      }
    });
  }
}
