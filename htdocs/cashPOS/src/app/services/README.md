# API Service

A comprehensive Angular HTTP service for making API requests with support for GET, POST, PUT, PATCH, and DELETE operations.

## Features

- **Generic HTTP methods**: GET, POST, PUT, PATCH, DELETE
- **Error handling**: Centralized error handling with console logging
- **Retry logic**: Automatic retry on failed requests
- **Request timeout**: Configurable timeout (default: 30 seconds)
- **Query parameters**: Built-in support for URL parameters
- **Type safety**: Full TypeScript support with generics
- **Tested**: Comprehensive unit tests using Jasmine/Karma

## Usage

### Import the Service

The service is provided at the root level, so you can inject it directly into any component or service:

```typescript
import { Component } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-example',
  template: `...`
})
export class ExampleComponent {
  constructor(private api: ApiService) {}
}
```

### Setting the Base URL

By default, the API base URL is `/api`. You can change it using:

```typescript
this.api.setApiUrl('https://your-api-domain.com/api');
```

### GET Request

```typescript
// Simple GET request
this.api.get<Product>('/products/1').subscribe(
  (product) => console.log(product),
  (error) => console.error(error)
);

// GET with query parameters
this.api.get<Product[]>('/products', { category: 'electronics', limit: 10 }).subscribe(
  (products) => console.log(products),
  (error) => console.error(error)
);
```

### POST Request

```typescript
const newProduct = {
  name: 'Laptop',
  price: 999.99,
  category: 'electronics'
};

this.api.post<Product>('/products', newProduct).subscribe(
  (createdProduct) => console.log(createdProduct),
  (error) => console.error(error)
);
```

### PUT Request

```typescript
const updatedProduct = {
  name: 'Updated Laptop',
  price: 1099.99
};

this.api.put<Product>('/products/1', updatedProduct).subscribe(
  (result) => console.log(result),
  (error) => console.error(error)
);
```

### PATCH Request

```typescript
const patchData = { price: 899.99 };

this.api.patch<Product>('/products/1', patchData).subscribe(
  (result) => console.log(result),
  (error) => console.error(error)
);
```

### DELETE Request

```typescript
this.api.delete<any>('/products/1').subscribe(
  (response) => console.log('Deleted successfully'),
  (error) => console.error(error)
);
```

## Configuration

You can customize the service behavior by modifying the following properties:

- `apiUrl`: Base URL for all API requests (default: `/api`)
- `timeoutDuration`: Request timeout in milliseconds (default: 30000)
- `retryAttempts`: Number of retry attempts for failed requests (default: 1)

## Error Handling

The service provides automatic error handling:

- **Client-side errors**: Network errors, CORS issues
- **Server-side errors**: HTTP status codes and error messages
- Errors are logged to the console and returned to the subscriber

## Testing

Unit tests are included using Jasmine and HttpClientTestingModule:

```bash
npm test
```

All HTTP methods are covered with tests including:
- Basic request verification
- Parameter handling
- Response validation
- Error scenarios
