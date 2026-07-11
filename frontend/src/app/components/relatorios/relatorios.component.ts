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

  private readonly F = 'font-family: Calibri, Arial, sans-serif;';

  private h2(texto: string): string {
    return `<p style="${this.F} font-size: 16pt; font-weight: bold; color: #333; border-bottom: 2px solid #333; padding-bottom: 6px; margin-bottom: 12px; margin-top: 0;">${texto}</p>`;
  }

  private h3(texto: string): string {
    return `<p style="${this.F} font-size: 13pt; font-weight: bold; color: #555; margin-top: 18px; margin-bottom: 6px;">${texto}</p>`;
  }

  private gerarHtmlWord(): string {
    const estilos = `
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; margin: 20px; }
      p { font-family: Calibri, Arial, sans-serif; font-size: 11pt; margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11pt; font-family: Calibri, Arial, sans-serif; }
      th { font-family: Calibri, Arial, sans-serif; background-color: #f2f2f2; font-weight: bold; border: 1px solid #aaa; padding: 6px 8px; text-align: left; }
      td { font-family: Calibri, Arial, sans-serif; border: 1px solid #aaa; padding: 6px 8px; text-align: left; }
      .destaque { color: #1a7a1a; font-weight: bold; }
      .saldo-inicial-row { background-color: #e8f5e9; }
    `;

    if (this.relatorioGeral) {
      return this.gerarHtmlRelatorioGeral(estilos);
    } else {
      return this.gerarHtmlRelatorioDetalhado(estilos);
    }
  }

  private gerarHtmlRelatorioGeral(estilos: string): string {
    const r = this.relatorioGeral;
    const t = r.totais;
    const periodo = `${this.getNomeMes(r.mes)} de ${r.ano}`;

    const tabelaPresencas = `
      ${this.h3('Presenças')}
      <table>
        <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Total de Reuniões</td><td>${t.TotalReunioes}</td></tr>
          <tr><td>Total de Membros</td><td>${t.TotalMembros}</td></tr>
          <tr><td>Total de Visitantes</td><td>${t.TotalVisitantes}</td></tr>
        </tbody>
      </table>`;

    const totalSetima = this.formatCurrency(t.TotalSetimaMes + t.TotalSetimaPixMes);
    const tabelaValores = `
      ${this.h3('Valores')}
      <table>
        <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Total Sétima</td><td class="destaque">R$ ${totalSetima}</td></tr>
          <tr><td>Total de Despesas</td><td>R$ ${this.formatCurrency(t.TotalDespesasMes)}</td></tr>
          <tr><td>Repasse</td><td>R$ ${this.formatCurrency(t.TotalRepasseMes)}</td></tr>
          <tr><td>Compra de Literatura</td><td>R$ ${this.formatCurrency(t.TotalCompraLiteraturaMes)}</td></tr>
        </tbody>
      </table>`;

    const tabelaFichas = `
      ${this.h3('Trocas de Fichas')}
      <table>
        <thead><tr><th>Descrição</th><th>Quantidade</th></tr></thead>
        <tbody>
          <tr><td>Ingressos</td><td>${t.TotalIngresso}</td></tr>
          <tr><td>30 Dias</td><td>${t.TotalTrintaDias}</td></tr>
          <tr><td>60 Dias</td><td>${t.TotalSessentaDias}</td></tr>
          <tr><td>90 Dias</td><td>${t.TotalNoventaDias}</td></tr>
          <tr><td>6 Meses</td><td>${t.TotalSeisMeses}</td></tr>
          <tr><td>9 Meses</td><td>${t.TotalNoveMeses}</td></tr>
          <tr><td>1 Ano</td><td>${t.TotalUmAno}</td></tr>
          <tr><td>18 Meses</td><td>${t.TotalDezoitoMeses}</td></tr>
          <tr><td>Múltiplos Anos</td><td>${t.TotalMultiplosAnos}</td></tr>
        </tbody>
      </table>`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${estilos}</style></head><body>
      ${this.h2('Relatório Geral de Reuniões')}
      <p><strong>Grupo:</strong> ${r.grupo}</p>
      <p><strong>Período:</strong> ${periodo}</p>
      ${tabelaPresencas}
      ${tabelaValores}
      ${tabelaFichas}
    </body></html>`;
  }

  private gerarHtmlRelatorioDetalhado(estilos: string): string {
    const r = this.relatorioDetalhado;
    const t = r.totais;
    const periodo = `${this.getNomeMes(r.mes)} de ${r.ano}`;
    const sa = this.saldoAcumulado;

    // Tabela Totais do Mês
    let linhasSaldoInicial = '';
    if (sa) {
      linhasSaldoInicial = `<tr><td>Saldo Inicial</td><td>R$ ${this.formatCurrency(sa.saldoInicial)}</td></tr>`;
    }
    let linhasSaldoFinal = '';
    if (sa) {
      linhasSaldoFinal = `
        <tr><td>Saldo Inicial do Mês</td><td>R$ ${this.formatCurrency(sa.saldoInicial)}</td></tr>
        <tr><td>Saldo Final do Mês</td><td class="destaque">R$ ${this.formatCurrency(sa.saldoFinal)}</td></tr>`;
    }

    debugger;
    const tabelaTotais = `
      ${this.h3('Totais do Mês')}
      <table>
        <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
        <tbody>
          ${linhasSaldoInicial}
          <tr><td>Total Sétima (Dinheiro)</td><td>R$ ${this.formatCurrency(t.TotalSetimaMes)}</td></tr>
          <tr><td>Total Sétima (PIX)</td><td>R$ ${this.formatCurrency(t.TotalSetimaPixMes)}</td></tr>
          <tr><td>Total Venda Literatura</td><td>R$ ${this.formatCurrency(t.TotalVendaLiteraturaMes)}</td></tr>
          <tr><td>Total</td><td>R$ ${this.formatCurrency(t.TotalSetimaGeral)}</td></tr>
          <tr><td>Total Despesas</td><td>R$ ${this.formatCurrency(t.TotalDespesasMes)}</td></tr>
          <tr><td>Saldo do Mês</td><td class="destaque">R$ ${this.formatCurrency(t.SaldoMes)}</td></tr>
          ${linhasSaldoFinal}
        </tbody>
      </table>`;

    // Tabela Saldo Acumulado
    let tabelaSaldoAcumulado = '';
    if (sa && sa.saldoPorData && sa.saldoPorData.length > 0) {
      const linhas = sa.saldoPorData.map((item: any) => {
        const isSaldoInicial = item.tipo === 'saldo_inicial';
        const trClass = isSaldoInicial ? ' class="saldo-inicial-row"' : '';
        const dataLabel = isSaldoInicial
          ? `${this.formatDate(item.data)} (Saldo Anterior)`
          : this.formatDate(item.data);
        const setimaDin = item.setimaDinheiro !== undefined ? `R$ ${this.formatCurrency(item.setimaDinheiro)}` : '-';
        const setimaPix = item.setimaPix !== undefined ? `R$ ${this.formatCurrency(item.setimaPix)}` : '-';
        const vendaLit = item.vendaLiteratura !== undefined ? `R$ ${this.formatCurrency(item.vendaLiteratura)}` : '-';
        const total = item.total !== undefined ? `R$ ${this.formatCurrency(item.total)}` : '-';
        const despesas = item.despesas !== undefined ? `R$ ${this.formatCurrency(item.despesas)}` : '-';
        const saldoCor = item.saldo >= 0 ? '#1a7a1a' : '#c0392b';
        return `<tr${trClass}>
          <td>${dataLabel}</td>
          <td>${setimaDin}</td>
          <td>${setimaPix}</td>
          <td>${vendaLit}</td>
          <td>${total}</td>
          <td>${despesas}</td>
          <td style="color:${saldoCor}; font-weight:bold;">R$ ${this.formatCurrency(item.saldo)}</td>
        </tr>`;
      }).join('');

      tabelaSaldoAcumulado = `
        ${this.h3(`Saldo Acumulado - ${periodo}`)}
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Sétima Dinheiro</th>
              <th>Sétima Pix</th>
              <th>Venda Literatura</th>
              <th>Total</th>
              <th>Despesas</th>
              <th>Saldo Acumulado</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>`;
    }

    // Tabela Detalhamento de Despesas
    const todasDespesas = this.getTodasDespesas();
    let tabelaDespesas = '';
    if (todasDespesas.length > 0) {
      const linhas = todasDespesas.map((d: any) =>
        `<tr>
          <td>${this.formatDate(d.dataReuniao)}</td>
          <td>${d.Descricao}</td>
          <td>R$ ${this.formatCurrency(d.ValorDespesa)}</td>
        </tr>`
      ).join('');
      tabelaDespesas = `
        ${this.h3('Detalhamento de Despesas')}
        <table>
          <thead>
            <tr><th>Data da Reunião</th><th>Descrição</th><th>Valor</th></tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>`;
    } else {
      tabelaDespesas = `
        ${this.h3('Detalhamento de Despesas')}
        <p style="color:#666; font-style:italic; font-family: Calibri, Arial, sans-serif;">Nenhuma despesa cadastrada</p>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${estilos}</style></head><body>
      ${this.h2('Relatório Detalhado de Sétima e Despesas')}
      <p><strong>Grupo:</strong> ${r.grupo}</p>
      <p><strong>Período:</strong> ${periodo}</p>
      ${tabelaTotais}
      ${tabelaSaldoAcumulado}
      ${tabelaDespesas}
    </body></html>`;
  }

  async exportarParaWord() {
    if (!this.relatorioGeral && !this.relatorioDetalhado) {
      alert('Gere um relatório antes de exportar');
      return;
    }

    try {
      const htmlContent = this.gerarHtmlWord();

      // Converter para DOCX
      const resultado = await asBlob(htmlContent);

      // Garantir que temos um Blob (não Buffer)
      let blob: Blob;
      if (resultado instanceof Blob) {
        blob = resultado;
      } else {
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
