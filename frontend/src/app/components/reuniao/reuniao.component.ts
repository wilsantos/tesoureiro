import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { PapelGrupo } from '../../models/usuario.model';

type AbaReuniao = 'secretaria' | 'tesouraria';

@Component({
  selector: 'app-reuniao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reuniao.component.html',
  styleUrl: './reuniao.component.css'
})
export class ReuniaoComponent implements OnInit {
  reunioes: any[] = [];
  grupos: any[] = [];
  despesasPorReuniao: Map<number, number> = new Map(); // Map<IdReuniao, TotalDespesas>
  reuniao: any = {
    Id: null,
    IdGrupo: null,
    Data: '',
    Membros: 0,
    Visitantes: 0,
    ValorSetima: 0,
    ValorSetimaPix: 0,
    VendaLiteratura: 0,
    Ingresso: 0,
    TrintaDias: 0,
    SessentaDias: 0,
    NoventaDias: 0,
    SeisMeses: 0,
    NoveMeses: 0,
    UmAno: 0,
    DezoitoMeses: 0,
    MultiplosAnos: 0,
    FatosRelevantes: ''
  };
  despesas: any[] = [];
  despesa: any = {
    Id: null,
    IdReuniao: null,
    Descricao: '',
    ValorDespesa: 0,
    repasse: false,
    compra_literatura: false
  };
  showFormulario: boolean = false;
  showFormularioDespesa: boolean = false;
  isEdit: boolean = false;
  isEditDespesa: boolean = false;
  valorDespesaInput: string = '';
  filtroGrupo: number | null = null;
  filtroMes: number = new Date().getMonth() + 1;
  filtroAnoInput: string = String(new Date().getFullYear());
  filtroAno: number = new Date().getFullYear();
  filtrosPreenchidos: boolean = false;
  abaAtiva: AbaReuniao = 'secretaria';
  salvandoReuniao = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  grupoSelecionado: boolean = false;
  nomeGrupoSelecionado: string = '';

  ngOnInit() {
    // Carregar grupos sempre
    this.reunioes = [];
    this.loadGrupos();
  }

  selecionarGrupo() {
    // Quando grupo é selecionado, verificar se pode carregar reuniões
    //debugger;
    if (this.filtroGrupo) {
      this.grupoSelecionado = true;
      this.nomeGrupoSelecionado = this.getGrupoNome(this.filtroGrupo);
      this.verificarFiltros();
    } else {
      this.grupoSelecionado = false;
      this.reunioes = [];
      this.filtrosPreenchidos = false;
    }
  }

  verificarFiltros() {
    // Verifica se grupo está selecionado e mês/ano estão preenchidos
    const todosPreenchidos = this.filtroMes > 0 && this.filtroAno > 0 && this.filtroGrupo !== null;
    
    if (todosPreenchidos) {
      // Todos os filtros preenchidos - carregar reuniões
      this.filtrosPreenchidos = true;
      this.aplicarFiltros();
    } else {
      // Algum filtro foi removido - limpar reuniões
      this.filtrosPreenchidos = false;
      this.reunioes = [];
    }
  }

  loadGrupos() {
    this.apiService.getGrupos().subscribe({
      next: (data) => {
        this.grupos = data;
        if (this.grupos.length === 1) {
          this.filtroGrupo = this.grupos[0].Id;
          this.selecionarGrupo();
        }
      },
      error: (error) => {
        console.error('Erro ao carregar grupos:', error);
        alert('Erro ao carregar grupos');
      }
    });
  }

  aplicarFiltros() {
    // Só aplica se os 3 filtros estiverem preenchidos
    if (!this.filtroMes || !this.filtroAno || !this.filtroGrupo) {
      this.reunioes = [];
      return;
    }

    const filtros = {
      idGrupo: this.filtroGrupo,
      mes: this.filtroMes,
      ano: this.filtroAno
    };

    this.apiService.getReunioes(filtros).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.reunioes = data;
          this.carregarDespesas();
        } else {
          console.error('Resposta inválida da API:', data);
          this.reunioes = [];
        }
      },
      error: (error) => {
        console.error('Erro ao carregar reuniões:', error);
        alert('Erro ao carregar reuniões: ' + (error.error?.message || error.message || 'Erro desconhecido'));
        this.reunioes = [];
      }
    });
  }

  carregarDespesas() {
    // Limpar mapa anterior
    this.despesasPorReuniao.clear();
    
    // Carregar todas as despesas (sem filtro de reunião)
    this.apiService.getDespesas().subscribe({
      next: (despesas) => {
        if (Array.isArray(despesas)) {
          // Agrupar despesas por IdReuniao e somar os valores
          despesas.forEach(despesa => {
            const idReuniao = despesa.IdReuniao;
            const valor = parseFloat(despesa.ValorDespesa) || 0;
            
            if (this.despesasPorReuniao.has(idReuniao)) {
              this.despesasPorReuniao.set(idReuniao, this.despesasPorReuniao.get(idReuniao)! + valor);
            } else {
              this.despesasPorReuniao.set(idReuniao, valor);
            }
          });
        }
      },
      error: (error) => {
        console.error('Erro ao carregar despesas:', error);
        // Não mostrar alerta, apenas logar o erro
      }
    });
  }

  onFiltroChange() {
    // Se mudou o grupo, atualizar flag
    if (this.filtroGrupo !== null) {
      this.grupoSelecionado = true;
    }
    this.verificarFiltros();
  }

  onAnoInputChange(): void {
    this.filtroAnoInput = this.filtroAnoInput.replace(/\D/g, '').slice(0, 4);
    const ano = parseInt(this.filtroAnoInput, 10);
    this.filtroAno = this.filtroAnoInput.length === 4 && !isNaN(ano) ? ano : 0;
    this.onFiltroChange();
  }

  getMeses(): { valor: number, nome: string }[] {
    return [
      { valor: 1, nome: 'Janeiro' },
      { valor: 2, nome: 'Fevereiro' },
      { valor: 3, nome: 'Março' },
      { valor: 4, nome: 'Abril' },
      { valor: 5, nome: 'Maio' },
      { valor: 6, nome: 'Junho' },
      { valor: 7, nome: 'Julho' },
      { valor: 8, nome: 'Agosto' },
      { valor: 9, nome: 'Setembro' },
      { valor: 10, nome: 'Outubro' },
      { valor: 11, nome: 'Novembro' },
      { valor: 12, nome: 'Dezembro' }
    ];
  }

  temEncargo(grupoId: number | null, papel: PapelGrupo): boolean {
    if (!grupoId) {
      return false;
    }

    const id = Number(grupoId);
    const grupos = this.authService.getUsuario()?.Grupos ?? [];
    return grupos.some(
      (vinculo) => vinculo.GrupoId === id && vinculo.Papel === papel && vinculo.Ativo !== false
    );
  }

  podeAcessarSecretaria(): boolean {
    return this.temEncargo(this.reuniao.IdGrupo, 'secretaria');
  }

  podeAcessarTesouraria(): boolean {
    return this.temEncargo(this.reuniao.IdGrupo, 'tesouraria');
  }

  selecionarAba(aba: AbaReuniao): void {
    if (aba === 'secretaria' && !this.podeAcessarSecretaria()) {
      return;
    }
    if (aba === 'tesouraria' && !this.podeAcessarTesouraria()) {
      return;
    }
    this.abaAtiva = aba;
  }

  private definirAbaInicial(): void {
    const temSecretaria = this.podeAcessarSecretaria();
    const temTesouraria = this.podeAcessarTesouraria();

    if (temSecretaria) {
      this.abaAtiva = 'secretaria';
    } else if (temTesouraria) {
      this.abaAtiva = 'tesouraria';
    }
  }

  abrirFormulario(editReuniao?: any) {
    if (editReuniao) {
      this.reuniao = { ...editReuniao };
      this.isEdit = true;
      this.loadDespesas(this.reuniao.Id);
    } else {
      this.reuniao = {
        Id: null,
        IdGrupo: this.filtroGrupo,
        Data: new Date().toISOString().split('T')[0],
        Membros: 0,
        Visitantes: 0,
        ValorSetima: 0,
        ValorSetimaPix: 0,
        VendaLiteratura: 0,
        Ingresso: 0,
        TrintaDias: 0,
        SessentaDias: 0,
        NoventaDias: 0,
        SeisMeses: 0,
        NoveMeses: 0,
        UmAno: 0,
        DezoitoMeses: 0,
        MultiplosAnos: 0,
        FatosRelevantes: ''
      };
      this.despesas = [];
      this.isEdit = false;
    }

    this.fecharFormularioDespesa();
    this.definirAbaInicial();
    this.showFormulario = true;

    setTimeout(() => {
      document.getElementById('formulario-reuniao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  fecharFormulario() {
    this.showFormulario = false;
    this.fecharFormularioDespesa();
    this.abaAtiva = 'secretaria';
    this.reuniao = {
      Id: null,
      IdGrupo: null,
      Data: '',
      Membros: 0,
      Visitantes: 0,
      ValorSetima: 0,
      ValorSetimaPix: 0,
      VendaLiteratura: 0,
      Ingresso: 0,
      TrintaDias: 0,
      SessentaDias: 0,
      NoventaDias: 0,
      SeisMeses: 0,
      NoveMeses: 0,
      UmAno: 0,
      DezoitoMeses: 0,
      MultiplosAnos: 0,
      FatosRelevantes: ''
    };
    this.despesas = [];
  }

  loadDespesas(idReuniao: number) {
    this.apiService.getDespesas(idReuniao).subscribe({
      next: (data) => {
        this.despesas = data;
      },
      error: (error) => {
        console.error('Erro ao carregar despesas:', error);
      }
    });
  }

  abrirFormularioDespesa(editDespesa?: any) {
    if (editDespesa) {
      this.despesa = {
        ...editDespesa,
        repasse: editDespesa.repasse || false,
        compra_literatura: editDespesa.compra_literatura || false
      };
      this.valorDespesaInput = this.formatMonetaryInput(editDespesa.ValorDespesa);
      this.isEditDespesa = true;
    } else {
      this.despesa = {
        Id: null,
        IdReuniao: this.reuniao.Id,
        Descricao: '',
        ValorDespesa: 0,
        repasse: false,
        compra_literatura: false
      };
      this.valorDespesaInput = '';
      this.isEditDespesa = false;
    }
    this.showFormularioDespesa = true;
  }

  fecharFormularioDespesa() {
    this.showFormularioDespesa = false;
    this.valorDespesaInput = '';
    this.despesa = {
      Id: null,
      IdReuniao: null,
      Descricao: '',
      ValorDespesa: 0,
      repasse: false,
      compra_literatura: false
    };
  }

  formatMonetaryInput(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numero = typeof value === 'number' ? value : this.parseMonetaryValue(value);
    if (!numero) {
      return '';
    }

    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  onValorDespesaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^\d,]/g, '');

    const commaIndex = value.indexOf(',');
    if (commaIndex !== -1) {
      const integerPart = value.slice(0, commaIndex);
      const decimalPart = value.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2);
      value = `${integerPart},${decimalPart}`;
    }

    this.valorDespesaInput = value;
    input.value = value;
  }

  parseMonetaryValue(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }

    let normalized = String(value).trim();
    if (!normalized) {
      return 0;
    }

    if (normalized.includes(',')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    }

    return parseFloat(normalized) || 0;
  }

  private montarReuniaoParaSalvar(): Record<string, unknown> {
    return {
      ...this.reuniao,
      ValorSetima: parseFloat(this.reuniao.ValorSetima) || 0,
      ValorSetimaPix: parseFloat(this.reuniao.ValorSetimaPix) || 0,
      VendaLiteratura: parseFloat(this.reuniao.VendaLiteratura) || 0,
      FatosRelevantes: this.reuniao.FatosRelevantes || ''
    };
  }

  garantirReuniaoPersistida(): Observable<number> {
    if (this.reuniao.Id) {
      return of(this.reuniao.Id);
    }

    if (!this.reuniao.IdGrupo || !this.reuniao.Data) {
      return throwError(() => new Error('Preencha grupo e data da reunião'));
    }

    this.salvandoReuniao = true;

    return this.apiService.createReuniao(this.montarReuniaoParaSalvar()).pipe(
      switchMap((response) => {
        const idReuniao = response.id;
        if (!idReuniao) {
          return throwError(() => new Error('Erro ao criar reunião'));
        }
        this.reuniao.Id = idReuniao;
        this.isEdit = true;
        this.carregarDespesas();
        return of(idReuniao);
      }),
      finalize(() => {
        this.salvandoReuniao = false;
      })
    );
  }

  saveDespesa() {
    const valorDespesa = this.parseMonetaryValue(this.valorDespesaInput);

    if (!this.despesa.Descricao || !valorDespesa) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    this.garantirReuniaoPersistida().pipe(
      switchMap((idReuniao) => {
        const despesaParaSalvar = {
          ...this.despesa,
          IdReuniao: idReuniao,
          ValorDespesa: valorDespesa
        };

        return this.isEditDespesa
          ? this.apiService.updateDespesa(despesaParaSalvar)
          : this.apiService.createDespesa(despesaParaSalvar);
      })
    ).subscribe({
      next: () => {
        alert(this.isEditDespesa ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!');
        this.fecharFormularioDespesa();
        this.loadDespesas(this.reuniao.Id);
        this.carregarDespesas();
      },
      error: (error) => {
        console.error('Erro ao salvar despesa:', error);
        const errorMsg = error.error?.message || error.error?.error || error.message || 'Erro desconhecido';
        alert('Erro ao salvar despesa: ' + errorMsg);
      }
    });
  }

  deleteDespesa(id: number) {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      this.apiService.deleteDespesa(id).subscribe({
        next: () => {
          alert('Despesa excluída com sucesso!');
          this.loadDespesas(this.reuniao.Id);
          // Recarregar o mapa de despesas para atualizar o grid
          this.carregarDespesas();
        },
        error: (error) => {
          console.error('Erro ao excluir despesa:', error);
          alert('Erro ao excluir despesa');
        }
      });
    }
  }

  saveReuniao() {
    if (!this.reuniao.IdGrupo || !this.reuniao.Data) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const reuniaoParaSalvar = this.montarReuniaoParaSalvar();
    const jaPersistida = this.isEdit && this.reuniao.Id;

    const operacao = jaPersistida
      ? this.apiService.updateReuniao(reuniaoParaSalvar)
      : this.apiService.createReuniao(reuniaoParaSalvar);

    operacao.subscribe({
      next: (response) => {
        const idReuniao = jaPersistida ? this.reuniao.Id : response.id;
        if (idReuniao) {
          this.reuniao.Id = idReuniao;
          this.loadDespesas(idReuniao);
        }
        alert(jaPersistida ? 'Reunião atualizada com sucesso!' : 'Reunião criada com sucesso!');
        if (!jaPersistida) {
          this.isEdit = true;
        } else {
          this.fecharFormulario();
        }
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Erro ao salvar reunião:', error);
        const errorMsg = error.error?.message || error.error?.error || error.message || 'Erro desconhecido';
        const details = error.error ? JSON.stringify(error.error, null, 2) : '';
        alert('Erro ao salvar reunião: ' + errorMsg + (details ? '\n\nDetalhes:\n' + details : ''));
      }
    });
  }

  deleteReuniao(id: number) {
    if (confirm('Tem certeza que deseja excluir esta reunião?')) {
      this.apiService.deleteReuniao(id).subscribe({
        next: () => {
          alert('Reunião excluída com sucesso!');
          this.aplicarFiltros(); // Recarregar com os filtros atuais
        },
        error: (error) => {
          console.error('Erro ao excluir reunião:', error);
          alert('Erro ao excluir reunião');
        }
      });
    }
  }

  getGrupoNome(idGrupo: number): string { 
    if (!idGrupo) return 'N/A';
    const grupo = this.grupos.find(g => g.Id == idGrupo);
    return grupo ? grupo.Nome : 'N/A';
  }

  getGrupoNomeSelecionado(): string {
    //alert(this.nomeGrupoSelecionado);
    return this.nomeGrupoSelecionado;
   // if (!this.filtroGrupo) return '';
    //return this.getGrupoNome(this.filtroGrupo);
  }

  formatDate(date: string): string {
    if (!date) return '';
    
    // Parsear a data manualmente para evitar problemas de timezone
    // Formato esperado: YYYY-MM-DD
    const partes = date.split('-');
    if (partes.length === 3) {
      const ano = partes[0];
      const mes = partes[1];
      const dia = partes[2];
      return `${dia}/${mes}/${ano}`;
    }
    
    // Fallback: tentar usar Date se o formato for diferente
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Retorna a data original se inválida
    
    // Usar UTC para evitar problemas de timezone
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  getTotalSetima(reuniao: any): number {
    const valorSetima = parseFloat(reuniao.ValorSetima) || 0;
    const valorSetimaPix = parseFloat(reuniao.ValorSetimaPix) || 0;
    return valorSetima + valorSetimaPix;
  }

  getTotalDespesas(idReuniao: number): number {
    return this.despesasPorReuniao.get(idReuniao) || 0;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
