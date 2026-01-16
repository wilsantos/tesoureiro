import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

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
  reuniao: any = {
    Id: null,
    IdGrupo: null,
    Data: '',
    Membros: 0,
    Visitantes: 0,
    ValorSetima: 0,
    ValorSetimaPix: 0,
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
    Comprovante: null
  };
  showModal: boolean = false;
  showDespesaModal: boolean = false;
  isEdit: boolean = false;
  isEditDespesa: boolean = false;
  filtroGrupo: number | null = null;
  filtroMes: number | null = null;
  filtroAno: number | null = null;
  filtrosPreenchidos: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Carregar grupos sempre, mas não carregar reuniões até os 3 filtros serem preenchidos
    this.reunioes = [];
    this.loadGrupos();
  }

  verificarFiltros() {
    // Verifica se os 3 filtros estão preenchidos
    const todosPreenchidos = this.filtroMes !== null && this.filtroAno !== null && this.filtroGrupo !== null;
    
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

  onFiltroChange() {
    this.verificarFiltros();
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

  getAnos(): number[] {
    const anos: number[] = [];
    const anoAtual = new Date().getFullYear();
    // Gerar anos dos últimos 10 anos até 2 anos no futuro
    for (let i = anoAtual - 10; i <= anoAtual + 2; i++) {
      anos.push(i);
    }
    return anos.sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
  }

  openModal(editReuniao?: any) {
    if (editReuniao) {
      this.reuniao = { ...editReuniao };
      this.isEdit = true;
      this.loadDespesas(this.reuniao.Id);
    } else {
      this.reuniao = {
        Id: null,
        IdGrupo: null,
        Data: new Date().toISOString().split('T')[0],
        Membros: 0,
        Visitantes: 0,
        ValorSetima: 0,
        ValorSetimaPix: 0,
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
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.reuniao = {
      Id: null,
      IdGrupo: null,
      Data: '',
      Membros: 0,
      Visitantes: 0,
      ValorSetima: 0,
      ValorSetimaPix: 0,
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

  openDespesaModal(editDespesa?: any) {
    if (editDespesa) {
      this.despesa = { ...editDespesa };
      this.isEditDespesa = true;
    } else {
      this.despesa = {
        Id: null,
        IdReuniao: this.reuniao.Id,
        Descricao: '',
        ValorDespesa: 0,
        Comprovante: null
      };
      this.isEditDespesa = false;
    }
    this.showDespesaModal = true;
  }

  closeDespesaModal() {
    this.showDespesaModal = false;
    this.despesa = {
      Id: null,
      IdReuniao: null,
      Descricao: '',
      ValorDespesa: 0,
      Comprovante: null
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Converter para base64
        const base64 = e.target.result.split(',')[1];
        this.despesa.Comprovante = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  saveDespesa() {
    if (!this.despesa.Descricao || !this.despesa.ValorDespesa) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!this.despesa.IdReuniao) {
      alert('Salve a reunião primeiro antes de adicionar despesas');
      return;
    }

    const despesaParaSalvar = {
      ...this.despesa,
      ValorDespesa: parseFloat(this.despesa.ValorDespesa)
    };

    const operacao = this.isEditDespesa 
      ? this.apiService.updateDespesa(despesaParaSalvar)
      : this.apiService.createDespesa(despesaParaSalvar);

    operacao.subscribe({
      next: (response) => {
        alert(this.isEditDespesa ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!');
        this.closeDespesaModal();
        this.loadDespesas(this.reuniao.Id);
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

    const reuniaoParaSalvar = {
      ...this.reuniao,
      ValorSetima: parseFloat(this.reuniao.ValorSetima) || 0,
      ValorSetimaPix: parseFloat(this.reuniao.ValorSetimaPix) || 0,
      FatosRelevantes: this.reuniao.FatosRelevantes || ''
    };

    const operacao = this.isEdit 
      ? this.apiService.updateReuniao(reuniaoParaSalvar)
      : this.apiService.createReuniao(reuniaoParaSalvar);

    operacao.subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        const idReuniao = this.isEdit ? this.reuniao.Id : response.id;
        if (idReuniao) {
          this.reuniao.Id = idReuniao;
          this.loadDespesas(idReuniao);
        }
        alert(this.isEdit ? 'Reunião atualizada com sucesso!' : 'Reunião criada com sucesso!');
        if (!this.isEdit) {
          // Não fechar o modal se for criação, para permitir adicionar despesas
          this.isEdit = true;
        } else {
          this.closeModal();
        }
        this.aplicarFiltros(); // Recarregar com os filtros atuais
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
    const grupo = this.grupos.find(g => g.Id === idGrupo);
    return grupo ? grupo.Nome : 'N/A';
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
}
