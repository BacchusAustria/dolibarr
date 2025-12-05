```
📱 POS APPLICATION - COMPLETE FOLDER STRUCTURE
==============================================

dolibarr/
└── htdocs/
    └── POS/                                    # Project root
        ├── angular.json                        # Angular CLI config
        ├── tsconfig.json                       # TypeScript config
        ├── package.json                        # Dependencies
        ├── README.md                           # Project overview
        ├── STRUCTURE.md                        # 📘 Detailed structure guide
        ├── IMPLEMENTATION_SUMMARY.md           # 📘 What was done
        ├── QUICK_REFERENCE.md                  # 📘 Quick lookup guide
        │
        ├── src/
        │   ├── index.html                      # Entry HTML
        │   ├── main.ts                         # Bootstrap file
        │   ├── styles.css                      # Global styles
        │   │
        │   └── app/                            # 📂 APPLICATION ROOT
        │       ├── 📂 models/                  # 🎯 Data Types & Interfaces
        │       │   ├── index.ts                # Barrel export (re-exports all models)
        │       │   ├── product.model.ts        # Product interface
        │       │   ├── category.model.ts       # Category interface
        │       │   ├── cart.model.ts           # CartItem interface
        │       │   ├── customer.model.ts       # Customer interface
        │       │   └── discount.model.ts       # Discount interface
        │       │
        │       ├── 📂 services/                # 🔧 Business Logic & API Layer
        │       │   ├── api.service.ts          # Generic HTTP wrapper
        │       │   ├── api.service.spec.ts     # API service tests
        │       │   │
        │       │   ├── 📂 auth/                # Authentication
        │       │   │   ├── auth.service.ts     # Login, logout, token mgmt
        │       │   │   └── auth.service.spec.ts# Tests
        │       │   │
        │       │   ├── 📂 product/             # Product Management
        │       │   │   ├── product.service.ts  # Products & categories CRUD
        │       │   │   └── product.service.spec.ts
        │       │   │
        │       │   └── 📂 customer/            # Customer Management
        │       │       ├── customer.service.ts # Customer CRUD & search
        │       │       └── customer.service.spec.ts
        │       │
        │       ├── 📂 features/                # 🎨 Feature Components
        │       │   ├── 📂 auth/                # Login/Logout components
        │       │   │   ├── login.component.ts
        │       │   │   ├── login.component.html
        │       │   │   └── login.component.css
        │       │   │
        │       │   ├── 📂 cart/                # Shopping cart
        │       │   │   ├── cart.component.ts
        │       │   │   ├── cart-item.component.ts
        │       │   │   ├── checkout.component.ts
        │       │   │   └── cart.module.ts
        │       │   │
        │       │   ├── 📂 products/            # Product display
        │       │   │   ├── product-list.component.ts
        │       │   │   ├── product-detail.component.ts
        │       │   │   ├── product-filter.component.ts
        │       │   │   └── products.module.ts
        │       │   │
        │       │   └── 📂 customer/            # Customer selection
        │       │       ├── customer-select.component.ts
        │       │       ├── customer-profile.component.ts
        │       │       └── customer.module.ts
        │       │
        │       ├── 📂 guards/                  # 🛡️ Route Protection
        │       │   ├── auth.guard.ts           # Authentication guard
        │       │   └── auth.guard.spec.ts
        │       │
        │       ├── 📂 interceptors/            # 🔄 HTTP Interceptors
        │       │   ├── auth.interceptor.ts     # Add Bearer token to requests
        │       │   └── auth.interceptor.spec.ts
        │       │
        │       ├── 📂 utils/                   # 🔨 Utilities & Helpers
        │       │   ├── calculation.utils.ts    # Math, currency, discounts
        │       │   ├── calculation.utils.spec.ts
        │       │   ├── array.utils.ts          # Array manipulation
        │       │   ├── array.utils.spec.ts
        │       │   ├── validation.utils.ts     # (Optional) Form validation
        │       │   └── date.utils.ts           # (Optional) Date helpers
        │       │
        │       ├── 📂 constants/               # ⚙️ Configuration
        │       │   ├── app.constants.ts        # API endpoints, mock data, config
        │       │   ├── error-messages.ts       # (Optional) Error strings
        │       │   └── validators.ts           # (Optional) Validation rules
        │       │
        │       ├── 📄 app.ts                   # Main component
        │       ├── 📄 app.html                 # Main template
        │       ├── 📄 app.css                  # Main styles
        │       ├── 📄 app.spec.ts              # App tests
        │       │
        │       ├── 📄 app.config.ts            # Application configuration
        │       │                               # (providers, interceptors)
        │       │
        │       ├── 📄 app.routes.ts            # Route definitions
        │       └── 📄 app.routes.spec.ts       # Route tests
        │
        ├── public/                             # Static assets
        │   └── (icons, images, etc.)
        │
        └── node_modules/                       # Dependencies (gitignored)


LAYER BREAKDOWN
===============

┌─────────────────────────────────────────────────────────┐
│  UI LAYER                                               │
│  ├─ app.ts (main component)                            │
│  ├─ features/ (feature components)                     │
│  └─ templates (*.html files)                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  PRESENTATION LAYER                                     │
│  ├─ utils/ (calculations, formatting)                  │
│  ├─ guards/ (route protection)                         │
│  └─ constants/ (configuration values)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  BUSINESS LOGIC LAYER                                   │
│  ├─ services/                                          │
│  │  ├─ auth.service (authentication)                  │
│  │  ├─ product.service (products)                     │
│  │  └─ customer.service (customers)                   │
│  └─ models/ (data types)                              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  DATA ACCESS LAYER                                      │
│  ├─ api.service (HTTP client wrapper)                  │
│  ├─ interceptors/ (auth token injection)               │
│  └─ guards/ (auth state checks)                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  EXTERNAL API LAYER                                     │
│  └─ Dolibarr REST API                                  │
└─────────────────────────────────────────────────────────┘


DEPENDENCY FLOW
===============

COMPONENT (app.ts)
    ↓ uses
SERVICE (auth.service, product.service, customer.service)
    ↓ calls
GENERIC SERVICE (api.service)
    ↓ applies
INTERCEPTOR (auth.interceptor)
    ↓ makes
HTTP REQUEST
    ↓ to
BACKEND API (Dolibarr)


FILE NAMING CONVENTIONS
=======================

Components:     {feature}.component.ts
Templates:      {feature}.component.html
Styles:         {feature}.component.css
Tests:          {feature}.component.spec.ts

Services:       {domain}.service.ts
Tests:          {domain}.service.spec.ts

Utilities:      {purpose}.utils.ts
Tests:          {purpose}.utils.spec.ts

Interfaces:     {entity}.model.ts
Guards:         {type}.guard.ts
Interceptors:   {type}.interceptor.ts

Constants:      app.constants.ts OR {feature}.constants.ts
Config:         {feature}.config.ts


IMPORT PATTERNS
===============

✅ GOOD:
  import { Product } from '@models/product.model';
  import { AuthService } from '@services/auth/auth.service';
  import { CalculationUtils } from '@utils/calculation.utils';

❌ BAD:
  import { Product } from '../../../models/product.model';
  import { AuthService } from '../../../../services/auth/auth.service';


SCALABILITY MILESTONES
======================

Current (Phase 1):
  ✅ Modular services
  ✅ Organized models
  ✅ Utility functions
  ✅ Generic API service

Next (Phase 2):
  → Convert features to NgModules
  → Implement lazy loading
  → Add @ngrx/store for state management

Later (Phase 3+):
  → Repository pattern for data access
  → API response DTOs/mappers
  → Facade services
  → Comprehensive error handling middleware
  → OpenAPI/Swagger integration
  → E2E testing suite


QUICK FILE LOCATIONS
====================

Need to...                          Look in...
─────────────────────────────────────────────────────────
Add a new data type               models/{name}.model.ts
Add new API methods               services/{domain}/{domain}.service.ts
Create UI for feature             features/{feature}/{feature}.component.*
Add calculation logic             utils/calculation.utils.ts
Add array helpers                 utils/array.utils.ts
Change API endpoints              constants/app.constants.ts
Add route protection              guards/{type}.guard.ts
Intercept HTTP requests           interceptors/{type}.interceptor.ts
Store app config                  constants/app.constants.ts
Add test cases                     {file}.spec.ts (same folder)
Configure providers               app.config.ts


VERSION & NOTES
===============

Structure Version:  1.0 (Dec 3, 2025)
Angular Version:    20.3.0
TypeScript:         5.9.2
Status:             ✅ Production Ready
Compilation:        ✅ Zero Errors
```
