# POS Application - File Structure Guide

This document outlines the best-practice file structure for the Angular POS (Point of Sale) application.

## Directory Structure

```
src/app/
├── models/              # Data models and interfaces
│   ├── index.ts        # Central export file
│   ├── product.model.ts
│   ├── category.model.ts
│   ├── cart.model.ts
│   ├── customer.model.ts
│   └── discount.model.ts
│
├── services/            # Business logic and API communication
│   ├── api.service.ts   # Generic HTTP service
│   ├── auth/
│   │   ├── auth.service.ts          # Authentication logic
│   │   └── auth.service.spec.ts
│   ├── product/
│   │   └── product.service.ts       # Product & category management
│   └── customer/
│       └── customer.service.ts      # Customer management
│
├── features/            # Feature-specific components and logic
│   ├── auth/           # Authentication components
│   ├── cart/           # Shopping cart components
│   ├── products/       # Product display and management
│   └── customer/       # Customer selection and management
│
├── guards/              # Route guards and protectors
│   └── auth.guard.ts    # Authentication guard
│
├── interceptors/        # HTTP interceptors
│   └── auth.interceptor.ts  # Adds auth token to requests
│
├── utils/               # Utility functions and helpers
│   ├── calculation.utils.ts  # Math and currency calculations
│   └── array.utils.ts        # Array manipulation helpers
│
├── constants/           # App constants and configurations
│   └── app.constants.ts # API endpoints, mock data, config
│
├── app.ts               # Main component
├── app.config.ts        # Application configuration
├── app.routes.ts        # Routing configuration
├── app.html             # Main template
└── app.css              # Main styles
```

## Directory Purposes

### `/models`
**Purpose:** Define TypeScript interfaces and data types

- Centralized type definitions used across the app
- Exported via `index.ts` for clean imports
- One interface per file for better organization
- Example import:
  ```typescript
  import { Product, Category, Customer } from './models';
  ```

### `/services`
**Purpose:** Handle business logic and API communication

#### `/services/api.service.ts`
- Generic HTTP wrapper around Angular's `HttpClient`
- Methods: GET, POST, PUT, PATCH, DELETE
- Handles errors, retries, and timeouts
- Used by all specialized services

#### `/services/auth`
- `AuthService`: Login, logout, token management
- Responsible for authentication workflow
- Stores/retrieves tokens from localStorage

#### `/services/product`
- `ProductService`: Fetch products and categories from API
- Methods to get, create, update, delete products
- Converts Observables to Promises

#### `/services/customer`
- `CustomerService`: Customer CRUD operations
- Search functionality
- List and detail views support

### `/features`
**Purpose:** Feature-specific components and business logic

Organize UI components by feature:
- `auth/` - Login/logout components
- `cart/` - Cart display and management
- `products/` - Product listing and details
- `customer/` - Customer selection

Typical structure per feature:
```
feature-name/
├── components/
│   └── feature.component.ts
├── services/
│   └── feature.service.ts
└── models/
    └── feature.model.ts
```

### `/guards`
**Purpose:** Control route access

- `AuthGuard`: Protects routes requiring authentication
- Can be applied to routes via `canActivate`

### `/interceptors`
**Purpose:** Intercept and modify HTTP requests/responses

- `AuthInterceptor`: Automatically adds Bearer token to requests
- Registered in `app.config.ts`

### `/utils`
**Purpose:** Reusable utility functions

- **`calculation.utils.ts`**: Mathematical operations
  - Discount calculations
  - Currency formatting
  - Rounding operations

- **`array.utils.ts`**: Array operations
  - Filtering with multiple conditions
  - Grouping arrays
  - Array manipulation

### `/constants`
**Purpose:** Store application-wide constants

- API endpoints
- Mock data for development
- Application configuration (timeouts, retry attempts)

## Import Patterns

### Good Practices

✅ Import from barrel exports (index.ts):
```typescript
import { Product, Category } from '../models';
```

✅ Use path aliases for cleaner imports:
```typescript
// In tsconfig.json:
"paths": {
  "@models/*": ["src/app/models/*"],
  "@services/*": ["src/app/services/*"],
  "@utils/*": ["src/app/utils/*"]
}

// In component:
import { Product } from '@models';
```

✅ Group imports logically:
```typescript
// 1. Angular imports
import { Component, OnInit } from '@angular/core';

// 2. Local imports
import { ProductService } from '@services/product';
import { Product } from '@models';
```

### Avoid

❌ Deep imports from nested files:
```typescript
// Bad
import { ProductService } from '../../../services/product/product.service';
```

❌ Circular dependencies:
```typescript
// Bad: service imports component that imports the service
```

## Service Usage Examples

### Authentication
```typescript
constructor(private authService: AuthService) {}

async login(username: string, password: string) {
  const token = await this.authService.login(username, password);
  // Use token...
}
```

### Product Management
```typescript
constructor(private productService: ProductService) {}

async loadProducts() {
  const products = await this.productService.getProducts();
  const categories = await this.productService.getCategories();
}
```

### Customer Management
```typescript
constructor(private customerService: CustomerService) {}

async searchCustomers(query: string) {
  const results = await this.customerService.searchCustomers(query);
}
```

## Utilities Usage

### Calculations
```typescript
import { CalculationUtils } from '@utils/calculation.utils';

const total = CalculationUtils.calculateItemTotal(
  price,
  quantity,
  discountValue,
  'percent'
);

const formatted = CalculationUtils.formatCurrency(total);
```

### Array Operations
```typescript
import { ArrayUtils } from '@utils/array.utils';

const grouped = ArrayUtils.groupBy(items, item => item.category);
```

## Configuration

### API Configuration
Update `app.constants.ts` to configure:
- API base URLs
- Timeout durations
- Retry attempts
- Mock data

### Feature Modules
For scalability, consider converting features to NgModules:
```typescript
// cart.module.ts
@NgModule({
  declarations: [CartComponent],
  imports: [CommonModule, FormsModule],
  providers: [CartService]
})
export class CartModule { }
```

## Testing Structure

Each service should have a corresponding `.spec.ts` file:
```
service.ts
service.spec.ts
```

Example:
```typescript
describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
  });

  it('should fetch products', async () => {
    const result = await service.getProducts();
    expect(result).toBeDefined();
  });
});
```

## Best Practices

1. **Single Responsibility**: Each file/class has one purpose
2. **DRY (Don't Repeat Yourself)**: Use utilities and shared services
3. **Type Safety**: Use TypeScript interfaces consistently
4. **Error Handling**: Centralized in services
5. **Testing**: Test at service level, not component level for logic
6. **Documentation**: Add JSDoc comments for public methods
7. **Lazy Loading**: Group features for potential lazy loading
8. **Dependency Injection**: Always use Angular's DI for services

## Scaling Considerations

### For Large Projects
1. **Convert to lazy-loaded modules**: `RouterModule.forChild(routes)`
2. **Add NgRx for state management**: Replace direct service subscriptions
3. **Create facade services**: Orchestrate multiple services
4. **Implement repository pattern**: Abstract API calls further
5. **Add API response DTOs**: Map between API and app models

### For Growing Teams
1. **Create shared component library**: `shared/components/`
2. **Add design tokens**: `constants/design-tokens.ts`
3. **Establish linting rules**: ESLint configuration
4. **Document API contracts**: OpenAPI/Swagger integration
5. **Add E2E tests**: Cypress or Playwright

## Common Modifications

### Adding a New Feature
1. Create feature folder in `/features`
2. Create service in `/services/{feature-name}`
3. Create models if needed in `/models/{feature-name}.model.ts`
4. Add feature component
5. Register in routing

### Adding a New Service
1. Create folder under `/services/{service-name}`
2. Create `{service-name}.service.ts`
3. Inject dependencies (usually `ApiService`)
4. Export from service module
5. Register in `app.config.ts` providers if needed

### Adding Utilities
1. Create file in `/utils/{utility-name}.utils.ts`
2. Export as static class with static methods
3. Add JSDoc comments
4. Add unit tests in `.spec.ts`
