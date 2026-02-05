import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { asBlob } from 'html-docx-js-typescript';

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
  saldoAcumulado: any = null;
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
    this.saldoAcumulado = null;
//debugger;
    // Buscar relatório
    this.apiService.getRelatorio(this.tipoRelatorio, this.filtroGrupo, this.filtroMes, this.filtroAno).subscribe({
      next: (data) => {
        if (this.tipoRelatorio === 'geral') {
          this.relatorioGeral = data;
          this.relatorioDetalhado = null;
          this.saldoAcumulado = null; // Garantir que saldo acumulado não aparece no relatório geral
          this.carregando = false;
        } else {
          this.relatorioDetalhado = data;
          this.relatorioGeral = null;
          // Para relatório detalhado, buscar saldo acumulado também
          this.buscarSaldoAcumulado();
        }
      },
      error: (error) => {
        this.carregando = false;
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + (error.error?.message || error.message || 'Erro desconhecido'));
      }
    });
  }

  private buscarSaldoAcumulado() {
    // Buscar saldo acumulado apenas para relatório detalhado
    // Os valores já foram validados em gerarRelatorio(), então não são null aqui
    if (!this.filtroGrupo || !this.filtroMes || !this.filtroAno) {
      return;
    }
    this.apiService.getSaldoAcumulado(this.filtroGrupo, this.filtroMes, this.filtroAno).subscribe({
      next: (data) => {
        this.saldoAcumulado = data;
        this.verificarCarregamentoCompleto();
      },
      error: (error) => {
        console.error('Erro ao buscar saldo acumulado:', error);
        // Não bloquear o relatório se o saldo acumulado falhar
        this.saldoAcumulado = null;
        this.verificarCarregamentoCompleto();
      }
    });
  }

  private verificarCarregamentoCompleto() {
    // Verifica se ambos os dados foram carregados (relatório detalhado + saldo acumulado)
    if (this.relatorioDetalhado) {
      this.carregando = false;
    }
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
    return meses.find(m => m.valor == mes)?.nome || '';
  }

  imprimirRelatorio() {
    window.print();
  }

  getTodasDespesas(): any[] {
    if (!this.relatorioDetalhado || !this.relatorioDetalhado.reunioes) {
      return [];
    }
    
    const todasDespesas: any[] = [];
    this.relatorioDetalhado.reunioes.forEach((item: any) => {
      if (item.despesas && item.despesas.length > 0) {
        item.despesas.forEach((despesa: any) => {
          todasDespesas.push({
            ...despesa,
            dataReuniao: item.reuniao.Data
          });
        });
      }
    });
    
    return todasDespesas;
  }

  async exportarParaWord() {
    if (!this.relatorioGeral && !this.relatorioDetalhado) {
      alert('Gere um relatório antes de exportar');
      return;
    }

    try {
      // Aguardar um pouco para garantir que o DOM está renderizado
      await new Promise(resolve => setTimeout(resolve, 200));

      // Encontrar o elemento do relatório
      const relatorioElement = document.querySelector('.relatorio-container');
      
      if (!relatorioElement) {
        alert('Erro ao encontrar conteúdo do relatório');
        return;
      }

      // Clonar o elemento para não modificar o original
      const clonedElement = relatorioElement.cloneNode(true) as HTMLElement;
      
      // Remover elementos que não devem aparecer no Word (botões, etc)
      const elementosParaRemover = clonedElement.querySelectorAll('button, .btn');
      elementosParaRemover.forEach(el => el.remove());

      // Criar um HTML limpo para exportação
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h3 { color: #555; margin-top: 20px; }
            h4 { color: #666; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .totais-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .total-item { background-color: #f8f9fa; padding: 15px; border-radius: 4px; }
            .total-item label { display: block; font-weight: bold; margin-bottom: 5px; }
            .total-item .valor { font-size: 1.2em; color: #007bff; }
            .destaque { color: #28a745 !important; font-weight: bold; }
            p { margin: 5px 0; }
          </style>
        </head>
        <body>
          ${clonedElement.innerHTML}
        </body>
        </html>
      `;

      // Converter para DOCX
      const resultado = await asBlob(htmlContent);
      
      // Garantir que temos um Blob (não Buffer)
      let blob: Blob;
      if (resultado instanceof Blob) {
        blob = resultado;
      } else {
        // Se for Buffer ou ArrayBuffer, converter para Blob
        const arrayBuffer = resultado instanceof ArrayBuffer ? resultado : new Uint8Array(resultado as any).buffer;
        blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }
      
      // Criar nome do arquivo (remover caracteres especiais)
      const grupoNome = (this.relatorioGeral?.grupo || this.relatorioDetalhado?.grupo || 'Relatorio')
        .replace(/[^a-zA-Z0-9]/g, '_');
      const mesNome = this.getNomeMes(this.filtroMes || 0);
      const ano = this.filtroAno || new Date().getFullYear();
      const tipoNome = this.tipoRelatorio === 'geral' ? 'Geral' : 'Detalhado';
      const nomeArquivo = `Relatorio_${tipoNome}_${grupoNome}_${mesNome}_${ano}.docx`;

      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar para Word:', error);
      alert('Erro ao exportar relatório para Word. Tente novamente.');
    }
  }
}
