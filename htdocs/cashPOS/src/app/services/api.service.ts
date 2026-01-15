// src/app/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'https://mittermayer.bplaced.net/dolibarr/htdocs/api/index.php';
  private timeoutDuration = 30000;

  /**
   * GET-Request
   */
  public get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { params: httpParams })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * POST-Request
   * Der Trick: Wir definieren die Options so, dass Angular sicher weiß, 
   * dass wir den JSON-Body zurückerwarten.
   */
  public post<T>(endpoint: string, body: any, options: { 
    params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
    responseType?: 'json'; // Wir fixieren dies auf 'json' für diesen Call
  } = {}): Observable<T> {
    
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, body, {
      ...options,
      responseType: 'json' // Erzwingt die Rückgabe von Observable<T> statt Observable<HttpEvent<T>>
    }).pipe(
      timeout(this.timeoutDuration),
      catchError(this.handleError)
    );
  }

  public put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, body)
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  public delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`)
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * Spezieller Request für Blobs (PDFs), hier ist der Rückgabetyp fixiert.
   */
  public getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${endpoint}`, { responseType: 'blob' })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = error.error?.message || `Server-Fehler: ${error.status}`;
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}