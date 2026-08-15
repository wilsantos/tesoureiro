import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { rootRedirectGuard } from './guards/root-redirect.guard';
import { AppShellComponent } from './shell/app-shell.component';
import { LoginComponent } from './auth/login/login.component';
import { CadastroComponent } from './auth/cadastro/cadastro.component';
import { GrupoComponent } from './components/grupo/grupo.component';
import { ReuniaoComponent } from './components/reuniao/reuniao.component';
import { RelatoriosComponent } from './components/relatorios/relatorios.component';
import { BlankComponent } from './shell/blank.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'cadastro',
    component: CadastroComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'grupos' },
      { path: 'grupos', component: GrupoComponent },
      { path: 'reunioes', component: ReuniaoComponent },
      { path: 'relatorios', component: RelatoriosComponent }
    ]
  },
  {
    path: '',
    pathMatch: 'full',
    component: BlankComponent,
    canActivate: [rootRedirectGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
