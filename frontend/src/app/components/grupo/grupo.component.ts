import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-grupo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupo.component.html',
  styleUrl: './grupo.component.css'
})
export class GrupoComponent implements OnInit {
  grupos: any[] = [];
  csas: any[] = [];
  grupo: any = {
    Id: null,
    Nome: '',
    Endereco: '',
    CSA: 0
  };
  showModal: boolean = false;
  isEdit: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadGrupos();
    this.loadCSAs();
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

  loadCSAs() {
    this.apiService.getCSAs().subscribe({
      next: (data) => {
        this.csas = data;
      },
      error: (error) => {
        console.error('Erro ao carregar CSAs:', error);
        alert('Erro ao carregar CSAs');
      }
    });
  }

  openModal(editGrupo?: any) {
    if (editGrupo) {
      this.grupo = { ...editGrupo };
      this.isEdit = true;
    } else {
      this.grupo = {
        Id: null,
        Nome: '',
        Endereco: '',
        CSA: 0
      };
      this.isEdit = false;
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.grupo = {
      Id: null,
      Nome: '',
      Endereco: '',
      CSA: 0
    };
  }

  saveGrupo() {
    if (!this.grupo.Nome || !this.grupo.Endereco || !this.grupo.CSA) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Garantir que CSA seja um número
    const grupoParaSalvar = {
      ...this.grupo,
      CSA: parseInt(this.grupo.CSA, 10)
    };

    const operacao = this.isEdit 
      ? this.apiService.updateGrupo(grupoParaSalvar)
      : this.apiService.createGrupo(grupoParaSalvar);

    operacao.subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        alert(this.isEdit ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!');
        this.closeModal();
        this.loadGrupos();
      },
      error: (error) => {
        console.error('Erro ao salvar grupo:', error);
        const errorMsg = error.error?.message || error.error?.error || error.message || 'Erro desconhecido';
        const details = error.error ? JSON.stringify(error.error, null, 2) : '';
        alert('Erro ao salvar grupo: ' + errorMsg + (details ? '\n\nDetalhes:\n' + details : ''));
      }
    });
  }

  deleteGrupo(id: number) {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      this.apiService.deleteGrupo(id).subscribe({
        next: () => {
          alert('Grupo excluído com sucesso!');
          this.loadGrupos();
        },
        error: (error) => {
          console.error('Erro ao excluir grupo:', error);
          alert('Erro ao excluir grupo');
        }
      });
    }
  }
}
