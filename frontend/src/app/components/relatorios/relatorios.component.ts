import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.css'
})
export class RelatoriosComponent implements OnInit {
  grupos: any[] = [];
  filtroGrupo: number | null = null;
  filtroMes: number | null = null;
  filtroAno: number | null = null;
  tipoRelatorio: string = 'geral';
  relatorioGeral: any = null;
  relatorioDetalhado: any = null;
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadGrupos();
    // Inicializar com mês e ano atual
    const hoje = new Date();
    this.filtroMes = hoje.getMonth() + 1;
    this.filtroAno = hoje.getFullYear();
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

  gerarRelatorio() {
    if (!this.filtroGrupo || !this.filtroMes || !this.filtroAno) {
      alert('Preencha todos os filtros (Grupo, Mês e Ano)');
      return;
    }

    this.carregando = true;
    this.relatorioGeral = null;
    this.relatorioDetalhado = null;

    this.apiService.getRelatorio(this.tipoRelatorio, this.filtroGrupo, this.filtroMes, this.filtroAno).subscribe({
      next: (data) => {
        this.carregando = false;
        if (this.tipoRelatorio === 'geral') {
          this.relatorioGeral = data;
        } else {
          this.relatorioDetalhado = data;
        }
      },
      error: (error) => {
        this.carregando = false;
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + (error.error?.message || error.message || 'Erro desconhecido'));
      }
    });
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
    for (let i = anoAtual - 10; i <= anoAtual + 2; i++) {
      anos.push(i);
    }
    return anos.sort((a, b) => b - a);
  }

  formatDate(date: string): string {
    if (!date) return '';
    const partes = date.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return date;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getNomeMes(mes: number): string {
    const meses = this.getMeses();
    return meses.find(m => m.valor === mes)?.nome || '';
  }

  imprimirRelatorio() {
    window.print();
  }
}
