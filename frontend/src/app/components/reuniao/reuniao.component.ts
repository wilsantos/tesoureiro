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
    ValorDespesa: 0,
    DescricaoDespesa: '',
    Ingresso: 0,
    TrintaDias: 0,
    SessentaDias: 0,
    NoventaDias: 0,
    SeisMeses: 0,
    NoveMeses: 0,
    UmAno: 0,
    DezoitoMeses: 0,
    MultiplosAnos: 0
  };
  showModal: boolean = false;
  isEdit: boolean = false;
  filtroGrupo: number | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadGrupos();
    this.loadReunioes();
  }

  loadGrupos() {
    this.apiService.getGrupos().subscribe({
      next: (data) => {
        this.grupos = data;
      },
      error: (error) => {
        console.error('Erro ao carregar grupos:', error);
      }
    });
  }

  loadReunioes() {
    const idGrupo = this.filtroGrupo || undefined;
    this.apiService.getReunioes(idGrupo).subscribe({
      next: (data) => {
        this.reunioes = data;
      },
      error: (error) => {
        console.error('Erro ao carregar reuniões:', error);
        alert('Erro ao carregar reuniões');
      }
    });
  }

  onFiltroChange() {
    this.loadReunioes();
  }

  openModal(editReuniao?: any) {
    if (editReuniao) {
      this.reuniao = { ...editReuniao };
      this.isEdit = true;
    } else {
      this.reuniao = {
        Id: null,
        IdGrupo: null,
        Data: new Date().toISOString().split('T')[0],
        Membros: 0,
        Visitantes: 0,
        ValorSetima: 0,
        ValorDespesa: 0,
        DescricaoDespesa: '',
        Ingresso: 0,
        TrintaDias: 0,
        SessentaDias: 0,
        NoventaDias: 0,
        SeisMeses: 0,
        NoveMeses: 0,
        UmAno: 0,
        DezoitoMeses: 0,
        MultiplosAnos: 0
      };
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
      ValorDespesa: 0,
      DescricaoDespesa: '',
      Ingresso: 0,
      TrintaDias: 0,
      SessentaDias: 0,
      NoventaDias: 0,
      SeisMeses: 0,
      NoveMeses: 0,
      UmAno: 0,
      DezoitoMeses: 0,
      MultiplosAnos: 0
    };
  }

  saveReuniao() {
    if (!this.reuniao.IdGrupo || !this.reuniao.Data) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const operacao = this.isEdit 
      ? this.apiService.updateReuniao(this.reuniao)
      : this.apiService.createReuniao(this.reuniao);

    operacao.subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        alert(this.isEdit ? 'Reunião atualizada com sucesso!' : 'Reunião criada com sucesso!');
        this.closeModal();
        this.loadReunioes();
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
          this.loadReunioes();
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
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }
}
