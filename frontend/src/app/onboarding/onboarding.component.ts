import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, merge, Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CsaAutocompleteComponent } from '../components/csa-autocomplete/csa-autocomplete.component';
import { GrupoListItem } from '../models/grupo.model';
import {
  EncargoPreenchidoError,
  GrupoVinculo,
  OnboardingRequest,
  PapelGrupo
} from '../models/usuario.model';

interface GrupoSelecao {
  secretaria: boolean;
  tesouraria: boolean;
}

interface EncargoAgrupado {
  GrupoId: number;
  Nome: string;
  CSA_Nome: string;
  Papeis: PapelGrupo[];
}

interface NovoGrupoPendente {
  Nome: string;
  Endereco: string;
  CSA: number;
  secretaria: boolean;
  tesouraria: boolean;
}

const PAGE_SIZE = 30;

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CsaAutocompleteComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private filterSubscription?: Subscription;

  gruposVisiveis: GrupoListItem[] = [];
  selecionados: Record<number, GrupoSelecao> = {};
  novosGrupos: NovoGrupoPendente[] = [];
  vinculosAtivos: GrupoVinculo[] = [];

  isLoadingGrupos = true;
  isSubmitting = false;
  encerrandoGrupoId: number | null = null;
  errorMessage = '';
  successMessage = '';
  showModal = false;
  submitLabel = 'Salvar cadastro';

  totalGrupos = 0;
  pageOffset = 0;
  readonly pageSize = PAGE_SIZE;

  filterForm = this.fb.group({
    csa: [0],
    busca: ['']
  });

  novoGrupoForm = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(4000)]],
    endereco: ['', [Validators.required]],
    csa: [0, [Validators.required, Validators.min(1)]],
    secretaria: [false],
    tesouraria: [false]
  });

  ngOnInit(): void {
    const jaCompleto = this.auth.isOnboardingComplete();
    this.submitLabel = jaCompleto ? 'Salvar alterações' : 'Salvar e continuar';

    this.auth.usuario$.subscribe((usuario) => {
      this.vinculosAtivos = usuario?.Grupos ?? [];
    });

    this.filterSubscription = merge(
      this.filterForm.get('csa')!.valueChanges,
      this.filterForm.get('busca')!.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
    ).subscribe(() => {
      this.pageOffset = 0;
      this.carregarGrupos();
    });

    this.carregarGrupos();
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  get encargosAgrupados(): EncargoAgrupado[] {
    const map = new Map<number, EncargoAgrupado>();

    for (const v of this.vinculosAtivos) {
      if (!map.has(v.GrupoId)) {
        map.set(v.GrupoId, {
          GrupoId: v.GrupoId,
          Nome: v.Nome,
          CSA_Nome: v.CSA_Nome,
          Papeis: []
        });
      }

      map.get(v.GrupoId)!.Papeis.push(v.Papel);
    }

    return Array.from(map.values()).sort((a, b) => a.Nome.localeCompare(b.Nome));
  }

  get pageInicio(): number {
    return this.totalGrupos === 0 ? 0 : this.pageOffset + 1;
  }

  get pageFim(): number {
    return Math.min(this.pageOffset + this.gruposVisiveis.length, this.totalGrupos);
  }

  get temProximaPagina(): boolean {
    return this.pageOffset + this.pageSize < this.totalGrupos;
  }

  get temPaginaAnterior(): boolean {
    return this.pageOffset > 0;
  }

  get temFiltroAtivo(): boolean {
    const csa = Number(this.filterForm.value.csa);
    const busca = (this.filterForm.value.busca ?? '').trim();
    return csa > 0 || busca.length > 0;
  }

  carregarGrupos(): void {
    const csa = Number(this.filterForm.value.csa);
    const busca = (this.filterForm.value.busca ?? '').trim();

    this.isLoadingGrupos = true;
    this.errorMessage = '';

    this.api.getGruposPaginados({
      csa: csa > 0 ? csa : undefined,
      busca: busca || undefined,
      limit: this.pageSize,
      offset: this.pageOffset,
      disponiveis: true
    }).subscribe({
      next: (resposta) => {
        this.gruposVisiveis = resposta.items;
        this.totalGrupos = resposta.total;
        this.isLoadingGrupos = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os grupos.';
        this.gruposVisiveis = [];
        this.totalGrupos = 0;
        this.isLoadingGrupos = false;
      }
    });
  }

  paginaAnterior(): void {
    if (!this.temPaginaAnterior) {
      return;
    }

    this.pageOffset = Math.max(0, this.pageOffset - this.pageSize);
    this.carregarGrupos();
  }

  proximaPagina(): void {
    if (!this.temProximaPagina) {
      return;
    }

    this.pageOffset += this.pageSize;
    this.carregarGrupos();
  }

  limparBusca(): void {
    this.filterForm.patchValue({ busca: '' }, { emitEvent: true });
  }

  isPapelAtivo(grupoId: number, papel: PapelGrupo): boolean {
    return this.vinculosAtivos.some((v) => v.GrupoId === grupoId && v.Papel === papel);
  }

  isPapelMarcado(grupoId: number, papel: PapelGrupo): boolean {
    if (this.isPapelAtivo(grupoId, papel)) {
      return true;
    }

    return this.selecionados[grupoId]?.[papel] ?? false;
  }

  isPapelDesabilitado(grupoId: number, papel: PapelGrupo): boolean {
    return this.isPapelAtivo(grupoId, papel);
  }

  alterarPapel(grupo: GrupoListItem, papel: PapelGrupo, marcado: boolean): void {
    if (this.isPapelAtivo(grupo.Id, papel)) {
      return;
    }

    if (!this.selecionados[grupo.Id]) {
      this.selecionados[grupo.Id] = { secretaria: false, tesouraria: false };
    }

    this.selecionados[grupo.Id][papel] = marcado;

    if (!this.selecionados[grupo.Id].secretaria && !this.selecionados[grupo.Id].tesouraria) {
      delete this.selecionados[grupo.Id];
    }
  }

  encerrarEncargos(grupoId: number): void {
    if (!confirm('Encerrar todos os encargos ativos neste grupo?')) {
      return;
    }

    this.encerrandoGrupoId = grupoId;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.encerrarEncargos(grupoId).subscribe({
      next: (res) => {
        this.encerrandoGrupoId = null;
        this.successMessage = res.message;
        delete this.selecionados[grupoId];
      },
      error: (err: { error?: { message?: string } }) => {
        this.encerrandoGrupoId = null;
        this.errorMessage = err.error?.message || 'Não foi possível encerrar os encargos.';
      }
    });
  }

  labelPapel(papel: PapelGrupo): string {
    return papel === 'secretaria' ? 'Secretaria' : 'Tesouraria';
  }

  openModal(): void {
    const csaFiltro = Number(this.filterForm.value.csa);
    this.novoGrupoForm.reset({
      nome: '',
      endereco: '',
      csa: csaFiltro > 0 ? csaFiltro : 0,
      secretaria: false,
      tesouraria: false
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  adicionarNovoGrupo(): void {
    if (this.novoGrupoForm.invalid) {
      this.novoGrupoForm.markAllAsTouched();
      return;
    }

    const raw = this.novoGrupoForm.getRawValue();
    if (!raw.secretaria && !raw.tesouraria) {
      this.errorMessage = 'Marque ao menos um encargo para o novo grupo.';
      return;
    }

    this.novosGrupos.push({
      Nome: raw.nome!.trim(),
      Endereco: raw.endereco!.trim(),
      CSA: Number(raw.csa),
      secretaria: raw.secretaria ?? false,
      tesouraria: raw.tesouraria ?? false
    });

    this.errorMessage = '';
    this.closeModal();
  }

  removerNovoGrupo(index: number): void {
    this.novosGrupos.splice(index, 1);
  }

  private limparFormulario(): void {
    this.selecionados = {};
    this.novosGrupos = [];
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const body: OnboardingRequest = {
      Vinculos: [],
      NovosGrupos: []
    };

    for (const [grupoIdStr, papeis] of Object.entries(this.selecionados)) {
      const grupoId = Number(grupoIdStr);

      if (papeis.secretaria && !this.isPapelAtivo(grupoId, 'secretaria')) {
        body.Vinculos.push({ GrupoId: grupoId, Papel: 'secretaria' });
      }
      if (papeis.tesouraria && !this.isPapelAtivo(grupoId, 'tesouraria')) {
        body.Vinculos.push({ GrupoId: grupoId, Papel: 'tesouraria' });
      }
    }

    for (const novo of this.novosGrupos) {
      const papeis: PapelGrupo[] = [];
      if (novo.secretaria) {
        papeis.push('secretaria');
      }
      if (novo.tesouraria) {
        papeis.push('tesouraria');
      }

      body.NovosGrupos.push({
        Nome: novo.Nome,
        Endereco: novo.Endereco,
        CSA: novo.CSA,
        Papeis: papeis
      });
    }

    if (body.Vinculos.length === 0 && body.NovosGrupos.length === 0) {
      this.errorMessage = 'Marque ao menos um encargo (secretaria ou tesouraria) em um grupo.';
      return;
    }

    const eraCompleto = this.auth.isOnboardingComplete();
    this.isSubmitting = true;

    this.auth.completarOnboarding(body).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.limparFormulario();

        if (!eraCompleto) {
          this.router.navigate(['/app/grupos']);
          return;
        }

        this.successMessage = 'Cadastro atualizado com sucesso.';
        this.submitLabel = 'Salvar alterações';
      },
      error: (err: { error?: EncargoPreenchidoError | { message?: string } }) => {
        this.isSubmitting = false;
        const payload = err.error;

        if (payload && 'error' in payload && payload.error === 'encargo_preenchido') {
          const encargo = payload as EncargoPreenchidoError;
          alert(encargo.message);
          this.errorMessage = encargo.message;
          return;
        }

        this.errorMessage = payload?.message || 'Não foi possível salvar o cadastro.';
      }
    });
  }
}
