# Quick Reference Guide

## Project Structure at a Glance

### 🎯 Where to Add Things

| What | Where | Example |
|------|-------|---------|
| New model/interface | `/models/{name}.model.ts` | `user.model.ts` |
| New service | `/services/{domain}/{name}.service.ts` | `/services/payment/payment.service.ts` |
| New feature | `/features/{name}/` | `/features/checkout/` |
| New utility function | `/utils/{name}.utils.ts` | `validation.utils.ts` |
| New constant | `/constants/app.constants.ts` | Add to existing file |
| Route guard | `/guards/{name}.guard.ts` | `role.guard.ts` |
| HTTP interceptor | `/interceptors/{name}.interceptor.ts` | `error.interceptor.ts` |

## Common Tasks

### Add a New API Endpoint

1. Add endpoint to `constants/app.constants.ts`:
```typescript
export const API_ENDPOINTS = {
  NEW_FEATURE: {
    LIST: '/new-feature',
    DETAIL: (id: string) => `/new-feature/${id}`,
  }
};
```

2. Create service `/services/new-feature/new-feature.service.ts`:
```typescript
@Injectable({ providedIn: 'root' })
export class NewFeatureService {
  constructor(private api: ApiService) {}

  async getItems(): Promise<NewFeature[]> {
    return firstValueFrom(this.api.get<NewFeature[]>('/new-feature'));
  }
}
```

3. Use in component:
```typescript
constructor(private service: NewFeatureService) {}

async loadData() {
  this.items = await this.service.getItems();
}
```

### Add a New Calculation

1. Add function to `utils/calculation.utils.ts`:
```typescript
export class CalculationUtils {
  static calculateTax(amount: number, taxRate: number): number {
    return amount * (taxRate / 100);
  }
}
```

2. Use in component:
```typescript
import { CalculationUtils } from './utils/calculation.utils';

const tax = CalculationUtils.calculateTax(price, 19);
```

### Add a New Feature Component

1. Create folder: `/features/my-feature/`
2. Create component: `my-feature.component.ts`
3. Create template: `my-feature.component.html`
4. Create styles: `my-feature.component.css`
5. Create service if needed: `/services/my-feature/my-feature.service.ts`

### Import in App

```typescript
import { MyFeatureComponent } from './features/my-feature/my-feature.component';

@Component({
  imports: [MyFeatureComponent]
})
export class App { }
```

## Key Services

### AuthService
```typescript
// Login
const token = await authService.login(username, password);

// Logout
authService.logout();

// Check auth
if (authService.isAuthenticated()) { }

// Get token
const token = authService.getStoredToken();
```

### ProductService
```typescript
// Get all products
const products = await productService.getProducts();

// Get specific product
const product = await productService.getProductById(id);

// Get categories
const categories = await productService.getCategories();

// Create product
await productService.createProduct(productData);

// Update product
await productService.updateProduct(id, productData);

// Delete product
await productService.deleteProduct(id);
```

### CustomerService
```typescript
// Get all customers
const customers = await customerService.getCustomers();

// Search customers
const results = await customerService.searchCustomers(query);

// Get specific customer
const customer = await customerService.getCustomerById(id);

// Create customer
await customerService.createCustomer(customerData);

// Update customer
await customerService.updateCustomer(id, customerData);

// Delete customer
await customerService.deleteCustomer(id);
```

## Utility Functions

### CalculationUtils
```typescript
// Calculate discount
const discount = CalculationUtils.calculateDiscount(amount, 10, 'percent');

// Calculate item total
const total = CalculationUtils.calculateItemTotal(price, qty, discount, 'percent');

// Format currency
const formatted = CalculationUtils.formatCurrency(123.456); // "123.46"

// Round decimals
const rounded = CalculationUtils.roundToDecimals(123.456, 1); // 123.5
```

### ArrayUtils
```typescript
// Filter with conditions
const filtered = ArrayUtils.filterByConditions(items, [
  item => item.active,
  item => item.price > 100
]);

// Group by property
const grouped = ArrayUtils.groupBy(items, item => item.category);

// Find index
const idx = ArrayUtils.findIndex(items, item => item.id === 5);

// Remove item
const updated = ArrayUtils.remove(items, 0);
```

## File Organization Tips

✅ **Do:**
- Keep files small and focused (< 300 lines)
- Use meaningful, descriptive names
- Group related files together
- Use index.ts for barrel exports
- Add JSDoc comments to public methods

❌ **Don't:**
- Mix concerns in one file
- Use generic names like "util.ts" or "service.ts"
- Import from deeply nested paths
- Create circular dependencies
- Leave console.logs in production code

## Path Aliases (tsconfig.json)

Configure for cleaner imports:
```json
{
  "compilerOptions": {
    "paths": {
      "@models/*": ["src/app/models/*"],
      "@services/*": ["src/app/services/*"],
      "@features/*": ["src/app/features/*"],
      "@utils/*": ["src/app/utils/*"],
      "@constants/*": ["src/app/constants/*"],
      "@guards/*": ["src/app/guards/*"],
      "@interceptors/*": ["src/app/interceptors/*"]
    }
  }
}
```

Then use:
```typescript
import { Product } from '@models/product.model';
import { AuthService } from '@services/auth/auth.service';
```

## Error Handling Pattern

```typescript
try {
  const data = await this.service.getData();
  // Use data
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly error message
  this.showError('Failed to load data. Please try again.');
}
```

## Testing Pattern

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService]
    });
    service = TestBed.inject(MyService);
  });

  it('should do something', async () => {
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

## Compilation & Building

```bash
# Check for errors
ng build

# Run development server
npm start

# Run tests
npm test

# Build for production
ng build --configuration production
```

---

**For detailed documentation, see `STRUCTURE.md` and `IMPLEMENTATION_SUMMARY.md`**
