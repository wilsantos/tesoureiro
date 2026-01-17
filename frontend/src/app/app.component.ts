import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GrupoComponent } from './components/grupo/grupo.component';
import { ReuniaoComponent } from './components/reuniao/reuniao.component';
import { RelatoriosComponent } from './components/relatorios/relatorios.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GrupoComponent, ReuniaoComponent, RelatoriosComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  activeTab: string = 'grupos';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
