// src/app/services/api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://mittermayer.bplaced.net/dolibarr/htdocs/api/index.php';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verstellt sicher, dass keine Requests offen geblieben sind
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should perform a GET request', () => {
      const mockData = { id: 1, name: 'Test Product' };
      
      service.get('/products/1').subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle GET request with parameters', () => {
      const mockData = [{ id: 1, name: 'Product 1' }];
      const params = { category: 'electronics', limit: 10 };

      service.get('/products', params).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      // Überprüfung inklusive Query-Strings
      const req = httpMock.expectOne(request => 
        request.url === `${baseUrl}/products` && 
        request.params.get('category') === 'electronics' &&
        request.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });
  });

  describe('post', () => {
    it('should perform a POST request and force responseType json', () => {
      const payload = { name: 'New Product', price: 99.99 };
      const mockResponse = { id: 1, ...payload };

      service.post('/products', payload).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.responseType).toBe('json');
      req.flush(mockResponse);
    });
  });

  describe('put', () => {
    it('should perform a PUT request', () => {
      const payload = { name: 'Updated Product', price: 149.99 };
      const mockResponse = { id: 1, ...payload };

      service.put('/products/1', payload).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should perform a DELETE request', () => {
      const mockResponse = { success: true };

      service.delete('/products/1').subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getBlob', () => {
    it('should request a blob for files', () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });

      service.getBlob('/documents/1').subscribe(data => {
        expect(data instanceof Blob).toBe(true);
        expect(data.size).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/documents/1`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors correctly', () => {
      const errorMessage = 'Internal Server Error';

      service.get('/error').subscribe({
        error: (err) => {
          expect(err.message).toContain('Server-Fehler: 500');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/error`);
      req.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
    });
  });
});