import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = new AuthService(null!); // Injected via DI in actual usage
  if (authService.isAuthenticated()) {
    return true;
  }
  // this.router.navigate(['/login']);
  return false;
};
