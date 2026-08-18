import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const onboardingCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const decide = (): boolean | ReturnType<Router['createUrlTree']> => {
    if (auth.isOnboardingComplete()) {
      return true;
    }

    return router.createUrlTree(['/app/cadastro']);
  };

  const usuario = auth.getUsuario();
  if (usuario?.OnboardingCompleto !== undefined) {
    return decide();
  }

  return auth.carregarUsuarioAtual().pipe(
    map(() => decide()),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
