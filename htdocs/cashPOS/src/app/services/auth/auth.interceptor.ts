import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Wir holen den Key direkt aus dem localStorage
  const apiKey = localStorage.getItem('dolibarrApiKey');

  // Wenn ein Key existiert, klonen wir den Request und fügen den Header hinzu
  if (apiKey) {
    const authReq = req.clone({
      setHeaders: {
        'DOLI-API-KEY': apiKey,
        'Accept': 'application/json'
      }
    });
    return next(authReq);
  }

  // Falls kein Key da ist (z.B. beim Login-Request), einfach weitermachen
  return next(req);
};