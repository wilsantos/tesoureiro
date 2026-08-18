import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-documento-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './documento-legal.component.html',
  styleUrl: './documento-legal.component.css'
})
export class DocumentoLegalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

  documento: 'termos' | 'privacidade' = this.route.snapshot.data['documento'];

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      this.aplicarDocumento(data['documento'] as 'termos' | 'privacidade');
    });
  }

  get titulo(): string {
    return this.documento === 'termos' ? 'Termos de Serviço' : 'Política de Privacidade';
  }

  private aplicarDocumento(documento: 'termos' | 'privacidade'): void {
    this.documento = documento;
    this.title.setTitle(`${this.titulo} — Servidor de NA`);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }
}
