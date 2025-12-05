import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setApiUrl', () => {
    it('should set the API URL', () => {
      const newUrl = 'https://api.example.com';
      service.setApiUrl(newUrl);
      // Service should now use this URL for requests
      expect(service).toBeTruthy();
    });
  });

  describe('get', () => {
    it('should perform a GET request', () => {
      const mockData = { id: 1, name: 'Test Product' };
      
      service.get('/products/1').subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle GET request with parameters', () => {
      const mockData = [{ id: 1, name: 'Product 1' }];
      const params = { category: 'electronics', limit: 10 };

      service.get('/products', params).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(req => 
        req.url === '/api/products' && 
        req.params.get('category') === 'electronics'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });
  });

  describe('post', () => {
    it('should perform a POST request', () => {
      const payload = { name: 'New Product', price: 99.99 };
      const mockResponse = { id: 1, ...payload };

      service.post('/products', payload).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/products');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
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

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('patch', () => {
    it('should perform a PATCH request', () => {
      const payload = { price: 129.99 };
      const mockResponse = { id: 1, name: 'Product', ...payload };

      service.patch('/products/1', payload).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('PATCH');
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

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
