import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private api: ApiService) {}

  async login(username: string, password: string): Promise<string> {
    const loginEndpoint = '/login';
    const loginParams = {
      login: username,
      password: password
    };

    const response = await firstValueFrom(
      this.api.post<any>(loginEndpoint, loginParams)
    );

    const token = response?.token || response?.success?.token;
    if (!token) {
      throw new Error('No token received from server');
    }
    this.setStoredToken(token);
    return token;
  }

  logout(): void {
    localStorage.removeItem('dolibarrApiKey');
  }

  setStoredToken(token: string): void {
    localStorage.setItem('dolibarrApiKey', token);
  }
  getStoredToken(): string {
    return localStorage.getItem('dolibarrApiKey') || '';
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}
