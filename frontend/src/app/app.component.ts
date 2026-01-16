import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GrupoComponent } from './components/grupo/grupo.component';
import { ReuniaoComponent } from './components/reuniao/reuniao.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GrupoComponent, ReuniaoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  activeTab: string = 'grupos';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
