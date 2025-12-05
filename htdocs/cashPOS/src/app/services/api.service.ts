import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://mittermayer.bplaced.net/dolibarr/htdocs/api/index.php'; // Base API URL - configure as needed
  private timeoutDuration = 30000; // 30 seconds timeout
  private retryAttempts = 1;
  constructor(private http: HttpClient) {}

  /**
   * Set the base API URL
   * @param url - The base URL for API calls
   */
  public setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * GET request
   * @param endpoint - The API endpoint (e.g., '/products')
   * @param params - Optional query parameters
   * @returns Observable with the response data
   */
  public get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }

    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { params: httpParams, headers: this.getHeaders() })
      .pipe(
        retry(this.retryAttempts),
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * POST request
   * @param endpoint - The API endpoint (e.g., '/products')
   * @param data - The data to send in the request body
   * @returns Observable with the response data
   */
  public post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * PUT request
   * @param endpoint - The API endpoint (e.g., '/products/1')
   * @param data - The data to send in the request body
   * @returns Observable with the response data
   */
  public put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * PATCH request
   * @param endpoint - The API endpoint
   * @param data - The data to send in the request body
   * @returns Observable with the response data
   */
  public patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE request
   * @param endpoint - The API endpoint (e.g., '/products/1')
   * @returns Observable with the response data
   */
  public delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`)
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * Get default HTTP headers
   * @returns HttpHeaders object with common headers
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return headers;
  }

  /**
   * Handle HTTP errors
   * @param error - The error object
   * @returns Observable error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
