# Customer QR & Milk/Product Management System — Backend

A robust, enterprise-grade backend built with **Node.js**, **Express**, and **MongoDB (Mongoose)** for managing customer QR identification, product catalogs, customer assignment, product distribution transactions, and historical records.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin**: Complete control over Admins, Customers, Products, product pricing, global reports, and transaction logs.
   - **Admin**: Isolated view of assigned customers, QR scanner verification, product transaction entry, and customer history.
2. **Strict Admin Isolation**:
   - `adminId` is derived exclusively from the authenticated JWT token (`req.user.id`).
   - Admins can **NEVER** view, scan, or transact with another Admin's customers (`403 Forbidden`).
3. **QR Identification Engine**:
   - Secure alphanumeric tokens (`CUST_XXXXXXXX`).
   - High-resolution Base64 PNG QR code generation via `qrcode`.
   - QR code exposes **zero sensitive customer information**; acts purely as a secure lookup token.
4. **Immutable Price Snapshots**:
   - Every transaction saves a snapshot of `priceAtTransaction`, `productName`, and `unit` at the exact moment of sale.
   - Future price changes do not alter historical records.
5. **Comprehensive Validation & Error Handling**:
   - Schema validation via `Joi`.
   - Global error handling for Mongoose duplicates, CastErrors, validation issues, and JWT expirations.
6. **Zero-Setup Testing**:
   - Integrated test suite using `Jest`, `Supertest`, and `mongodb-memory-server`.

---

## 🏗️ Architecture & Project Structure

```
klim/
├── src/
│   ├── config/
│   │   ├── constants.js          # Roles, status enums, units
│   │   ├── env.js                # Environment configuration
│   │   └── db.js                 # MongoDB connection manager
│   ├── controllers/
│   │   ├── auth.controller.js    # Login, profile, logout
│   │   ├── admin.controller.js   # Admin CRUD & customer metrics
│   │   ├── customer.controller.js# Customer CRUD, QR scan, regenerate QR
│   │   ├── product.controller.js # Product catalog & price management
│   │   └── transaction.controller.js # Transaction recording & history
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification & role authorization
│   │   ├── error.middleware.js   # Centralized error handler
│   │   ├── rateLimiter.js        # Rate limiting middleware
│   │   └── validate.middleware.js# Joi schema validation
│   ├── models/
│   │   ├── User.js               # Super Admin & Admin schema
│   │   ├── Customer.js           # Customer schema with qrToken & qrCode
│   │   ├── Product.js            # Product catalog schema
│   │   └── Transaction.js        # Transaction schema with price snapshot
│   ├── routes/
│   │   ├── auth.routes.js        # /api/auth
│   │   ├── admin.routes.js       # /api/admins
│   │   ├── customer.routes.js    # /api/customers
│   │   ├── product.routes.js     # /api/products
│   │   ├── transaction.routes.js # /api/transactions
│   │   └── index.js              # Aggregated API router
│   ├── seeds/
│   │   └── seed.js               # Database seeding script
│   ├── services/
│   │   ├── admin.service.js      # Admin business logic
│   │   ├── auth.service.js       # Authentication & JWT issuance
│   │   ├── customer.service.js   # Customer logic & isolation checks
│   │   ├── product.service.js    # Catalog management
│   │   ├── qr.service.js         # QR token & image generation
│   │   └── transaction.service.js# Transaction logic & snapshot calculation
│   ├── utils/
│   │   ├── apiResponse.js        # Standardized API response format
│   │   ├── appError.js           # Custom AppError class
│   │   ├── pagination.js         # Pagination helper
│   │   └── tokenGenerator.js     # QR token generator
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
├── tests/
│   ├── admin.test.js             # Admin management tests
│   ├── adminIsolation.test.js    # Strict admin customer isolation tests
│   ├── auth.test.js              # Authentication tests
│   ├── customerQr.test.js        # Customer & QR scan tests
│   ├── product.test.js           # Product catalog tests
│   ├── setup.js                  # In-memory test setup
│   └── transaction.test.js       # Transaction & price snapshot tests
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables Configuration

Copy `.env.example` to `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/milk_qr_management
JWT_SECRET=super_secret_jwt_key_change_in_production_987654321
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Seed Database (Optional)

Run the seeding script to populate initial Super Admin, Admins, Products, Customers with QRs, and Transactions:

```bash
npm run seed
```

**Default Seed Credentials:**
- **Super Admin**: `admin@dairy.com` / `Admin@12345`
- **Admin A**: `admin.rajesh@dairy.com` / `Admin@12345`
- **Admin B**: `admin.sunil@dairy.com` / `Admin@12345`

### 4. Run Development Server

```bash
npm run dev
```

### 5. Run Automated Tests

Execute all unit & integration test suites using in-memory MongoDB:

```bash
npm test
```

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `GET` | `/api/auth/me` | Authenticated | Get currently authenticated profile |
| `POST` | `/api/auth/logout` | Authenticated | Logout |

---

### 👨‍💼 Admin Management (`/api/admins`) — Super Admin Only

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admins` | Create a new Admin |
| `GET` | `/api/admins` | List all Admins with assigned customer counts |
| `GET` | `/api/admins/:id` | Get Admin details with assigned customers preview |
| `PUT` | `/api/admins/:id` | Update Admin profile / status |
| `DELETE` | `/api/admins/:id` | Delete Admin (blocked if customers are assigned) |

---

### 👥 Customer Management (`/api/customers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/customers` | Admin, Super Admin | Create customer (auto-generates QR token & base64 image) |
| `GET` | `/api/customers` | Admin, Super Admin | List customers (Admin sees only assigned customers) |
| `GET` | `/api/customers/:id` | Admin, Super Admin | Get customer profile (enforces Admin ownership) |
| `PUT` | `/api/customers/:id` | Admin, Super Admin | Update customer profile |
| `DELETE` | `/api/customers/:id` | Admin, Super Admin | Delete customer |
| `GET` | `/api/customers/qr/:qrToken` | Admin, Super Admin | **QR Scan Flow**: Lookup customer by QR token |
| `POST` | `/api/customers/:id/regenerate-qr`| Admin, Super Admin | Regenerate QR token & code for a customer |
| `GET` | `/api/customers/:customerId/transactions`| Admin, Super Admin | View customer's transaction history & total spend |

---

### 🥛 Products Catalog (`/api/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Admin, Super Admin | List all active products & current prices |
| `GET` | `/api/products/:id` | Admin, Super Admin | Get product details |
| `POST` | `/api/products` | Super Admin | Create a new product with unit & price |
| `PUT` | `/api/products/:id` | Super Admin | Update product details / price / status |
| `DELETE` | `/api/products/:id` | Super Admin | Delete a product |

---

### 💳 Transactions (`/api/transactions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/transactions` | Admin, Super Admin | Record product given to customer (captures price snapshot) |
| `GET` | `/api/transactions` | Admin, Super Admin | List transactions with filters (date, product, customer) |
| `GET` | `/api/transactions/:id` | Admin, Super Admin | Get single transaction details |

---

## 🔒 Security & Admin Isolation Details

```
[FRONTEND REQUEST: POST /api/transactions]
                     │
                     ▼
[JWT Auth Middleware: protect] ──► Extracts user ID from JWT (req.user.id)
                     │
                     ▼
[Customer Verification] ─────────► Verifies customer.adminId === req.user.id
                     │
                     ├─ MATCH? ────► Fetches product price snapshot ──► Creates Transaction
                     │
                     └─ MISMATCH? ─► 403 Forbidden ("Access denied: You cannot record transactions for another Admin's customer")
```

---

## 🧪 Automated Test Coverage

The test suite covers:
- Authentication & JWT issuance
- Super Admin CRUD & privilege checks
- Customer creation and QR code generation
- **Strict Admin Isolation** (Admin A scanning/querying Admin B's customer returns `403 Forbidden`)
- Product management and pricing updates
- **Immutable Price Snapshots** (Old transactions retain historical price after catalog price changes)
- Customer transaction history calculations
