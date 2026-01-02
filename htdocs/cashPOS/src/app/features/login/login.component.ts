// src/app/features/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  
  // Formular-Daten
  public username: string = '';
  public password: string = '';

  public isLoading: boolean = false;
  public errorMessage: string | null = null;

  constructor(
    private authService: AuthService
  ) {
    // Initialisiere mit gespeicherten Werten
    this.username = ''; 
    this.password = ''; 
  }

  public async login(): Promise<void> {
    this.errorMessage = null;
    this.isLoading = true;

    if (!this.username || !this.password) {
      this.errorMessage = 'Bitte füllen Sie alle Felder aus.';
      this.isLoading = false;
      return;
    }
    
    try {      
      const token = await this.authService.login(this.username, this.password);
      
      console.log('Login erfolgreich. Token erhalten:', token);
      
      window.location.reload(); 

    } catch (error: any) {
      console.error('Login-Fehler:', error);
      // Entferne URL und Token, falls der Login fehlschlägt
      this.authService.logout(); 
      
      this.errorMessage = error.message || 'Anmeldung fehlgeschlagen. Überprüfen Sie Benutzername und Passwort.';
    } finally {
      this.isLoading = false;
    }
  }
}