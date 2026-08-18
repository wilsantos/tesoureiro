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
import { onboardingCompleteGuard } from './guards/onboarding-complete.guard';
import { appDefaultRedirectGuard } from './guards/app-default-redirect.guard';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { DocumentoLegalComponent } from './legal/documento-legal.component';

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
    path: 'onboarding',
    redirectTo: 'app/cadastro',
    pathMatch: 'full'
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [appDefaultRedirectGuard],
        component: BlankComponent
      },
      { path: 'cadastro', component: OnboardingComponent },
      {
        path: 'grupos',
        component: GrupoComponent,
        canActivate: [onboardingCompleteGuard]
      },
      {
        path: 'reunioes',
        component: ReuniaoComponent,
        canActivate: [onboardingCompleteGuard]
      },
      {
        path: 'relatorios',
        component: RelatoriosComponent,
        canActivate: [onboardingCompleteGuard]
      }
    ]
  },
  {
    path: '',
    pathMatch: 'full',
    component: BlankComponent,
    canActivate: [rootRedirectGuard]
  },
  {
    path: 'termos',
    component: DocumentoLegalComponent,
    data: { documento: 'termos' }
  },
  {
    path: 'privacidade',
    component: DocumentoLegalComponent,
    data: { documento: 'privacidade' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
