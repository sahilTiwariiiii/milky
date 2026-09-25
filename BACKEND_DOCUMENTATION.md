# Milky Dairy ERP Backend Documentation

This document explains how the Milky Dairy ERP software works, how its backend is structured, what each role can do, how data moves through the system, and how the frontend communicates with the API.

The backend source code is in `src/`. The React/Vite frontend is in `frontend/`.

## 1. What The Software Does

The application manages a dairy distribution business:

- Super Admins manage delivery admins, products, prices, customers, and system settings.
- Delivery Admins manage and serve only their assigned customers.
- Customers are identified with QR codes.
- Admins scan a customer QR code and record products delivered to that customer.
- Every transaction keeps the product name, unit, and price used at the time of delivery.
- Dashboards and reports show customers, products, transactions, and totals.

The backend is a REST API built with Node.js, Express, MongoDB, and Mongoose. The API base path is `/api`.

## 2. Overall Business Lifecycle

This is the main way the software is used in real life. In the application, the words **client** and **customer** refer to the same person or household receiving dairy products.

```text
SUPER ADMIN
        |
        | 1. Creates Admin accounts
        v
ADMIN / DELIVERY OPERATOR
        |
        | 2. Receives assigned customers from Super Admin
        v
ASSIGNED CUSTOMER / CLIENT
        |
        | 3. Customer receives a QR code
        v
DELIVERY DAY
        |
        | 4. Admin scans the customer's QR code
        | 5. Backend checks that the customer belongs to this Admin
        | 6. Admin records products and quantity delivered
        v
TRANSACTION HISTORY
        |
        | 7. System saves quantity, price, total, customer, and Admin
        v
REPORTING AND BILLING
```

### Step 1: Super Admin sets up the organization

The Super Admin is the owner or central manager of the business. After logging in, the Super Admin:

1. Creates delivery Admin accounts.
2. Adds the dairy products that the business sells.
3. Sets each product's unit and current price.
4. Creates or registers customers/clients.
5. Assigns each customer to the correct Admin who will serve them.

The assignment is stored on the customer as `customer.adminId`. This is the most important ownership link in the system.

### Step 2: Admin receives an assigned customer list

When an Admin logs in, the backend uses the Admin's user ID from the JWT token. The Admin sees only the customers whose `adminId` matches that user ID.

For example:

```text
Super Admin
  |
  +-- Admin A: Rajesh
  |     +-- Customer Rahul
  |     +-- Customer Priya
  |
  +-- Admin B: Sunil
                +-- Customer Vikram
```

Admin A cannot see, scan, or record a delivery for Vikram, because Vikram belongs to Admin B. The backend returns `403 Forbidden` for that attempt.

### Step 3: Customer receives a QR code

When a customer is created, the backend automatically:

1. Generates a unique QR token.
2. Creates a QR image from that token.
3. Saves both the token and image on the customer record.
4. Returns the QR image so it can be printed, downloaded, or shown to the customer.

The QR code is only an identification key. It does not expose private customer information.

### Step 4: Admin performs a delivery

During a delivery, the Admin:

1. Opens the QR scanner.
2. Scans the customer's QR code.
3. Sends the QR token to the backend.
4. The backend finds the customer.
5. The backend verifies that the scanned customer is assigned to the logged-in Admin.
6. The Admin selects the product and enters the quantity delivered.
7. The Admin optionally adds notes.
8. The backend creates the transaction.

The Admin does not choose the transaction price manually. The backend reads the active product price and calculates:

```text
totalAmount = quantity x current product price
```

### Step 5: System keeps the delivery record

Each transaction records:

- Which customer received the products.
- Which Admin recorded the delivery.
- Which product was delivered.
- The quantity and unit.
- The product name and price at that exact time.
- The calculated total amount.
- Optional delivery notes.
- The date and time.

The price and product details are copied into the transaction as snapshots. If the Super Admin changes the product price next month, old customer bills remain unchanged.

### Step 6: Super Admin monitors the business

The Super Admin can view the complete organization:

- All Admins and their assigned customers.
- All customers and their QR codes.
- All products and current prices.
- All delivery transactions.
- Customer histories and totals.
- Organization branding and system settings.

The Admin can view operational information only for their own assigned customers.

## 3. High-Level Architecture

```text
React/Vite frontend or mobile app
              |
              | HTTP/JSON, Bearer JWT
              v
        Express application
              |
   security, CORS, parsing, rate limit
              |
              v
       routes -> controllers -> services
                              |
                              v
                         Mongoose models
                              |
                              v
                           MongoDB

Optional file path: upload controller -> AWS S3 or local uploads/
QR path: customer service -> QR service -> token + base64 PNG
```

### Request lifecycle

1. A client sends a request to the API.
2. Express applies Helmet, CORS handling, request parsing, logging, and API rate limiting.
3. The route selects authentication, role checks, and Joi validation where required.
4. The controller reads the request and calls the relevant service.
5. The service applies business rules, ownership checks, calculations, and database operations.
6. Mongoose validates and persists the data in MongoDB.
7. The controller returns the common API response format.
8. Errors are passed to the central error middleware.

## 4. Project Structure

```text
klim/
├── src/                         # Actual backend
│   ├── app.js                   # Express app and global middleware
│   ├── server.js                # Startup, database, S3 check, HTTP listener
│   ├── config/
│   │   ├── constants.js         # Roles, statuses, product units
│   │   ├── db.js                # MongoDB connection and development fallback
│   │   └── env.js               # Environment variables and defaults
│   ├── controllers/             # HTTP request and response handlers
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT authentication and role authorization
│   │   ├── error.middleware.js   # Central error conversion
│   │   ├── rateLimiter.js        # API/login request limits
│   │   └── validate.middleware.js# Joi request validation
│   ├── models/                  # Mongoose schemas and database models
│   ├── routes/                  # Endpoint declarations
│   ├── services/                # Business logic and database workflows
│   ├── seeds/                   # Manual and automatic demo data
│   ├── utils/                   # Errors, responses, pagination, token helpers
│   └── validations/             # Joi schemas for request bodies and queries
├── frontend/                    # React/Vite client application
├── tests/                       # Jest/Supertest integration tests
├── uploads/                     # Local upload fallback directory
├── package.json                 # Backend scripts and dependencies
└── BACKEND_DOCUMENTATION.md     # This document
```

There is also a `frontend/src` server-style tree in the repository. The backend used by the root npm scripts is the root `src/` directory. The frontend application uses the React code under `frontend/src/`.

## 5. Startup And Runtime

The backend starts with `npm run dev` or `npm start`.

`src/server.js` performs these steps:

1. Loads environment configuration through `dotenv`.
2. Connects to MongoDB.
3. Checks whether the configured AWS S3 bucket is reachable.
4. Runs automatic seed logic when the database is empty.
5. Starts Express on `0.0.0.0` and the configured port.
6. Handles uncaught exceptions, unhandled promise rejections, and graceful shutdown signals.

The default port is `5000`. The API is normally available at `http://localhost:5000/api`.

### Database behavior

- Normal development and production use the `MONGODB_URI` connection.
- If MongoDB cannot be reached while `NODE_ENV=development`, the application attempts to start `mongodb-memory-server` as a temporary fallback.
- The fallback database is temporary and should not be treated as persistent storage.
- Tests use an in-memory MongoDB setup so they do not require a running database.

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Runtime mode | `development` |
| `MONGODB_URI` | MongoDB connection string | Local `milk_qr_management` database |
| `JWT_SECRET` | Secret used to sign JWTs | Development fallback only |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` |
| `CORS_ORIGIN` | Intended CORS origin setting | `*` |
| `AWS_ACCESS_KEY_ID` | AWS credential | Empty |
| `AWS_SECRET_ACCESS_KEY` | AWS credential | Empty |
| `AWS_REGION` | S3 region | Empty |
| `S3_BUCKET_NAME` | S3 bucket name | Empty |

For production, set a strong unique `JWT_SECRET`, configure a real MongoDB URI, restrict CORS, and provide valid S3 credentials if remote uploads are required.

## 6. Roles And Permissions

The system defines two roles:

### SUPER_ADMIN

The Super Admin is the organization-level operator. They can:

- Create, view, update, deactivate, and delete delivery admins.
- View all customers and all transactions.
- Create, update, deactivate, and delete products.
- Set product prices and units.
- Create customers and assign them to delivery admins.
- Reassign customers between admins.
- Update global system configuration and branding.
- Use all customer, QR, transaction, and reporting features.

### ADMIN

An Admin is a delivery operator. They can:

- View only customers assigned to their own user ID.
- Create customers; the backend assigns new customers to the logged-in admin.
- Update or delete their own customers.
- Scan QR codes for their own customers.
- Regenerate QR codes for their own customers.
- Record product distribution transactions for their own customers.
- View their customers' transaction history.
- Read the product catalog and current prices.

They cannot manage admins, change product prices, update global settings, or access another admin's customers.

### How access is enforced

1. The client sends `Authorization: Bearer <JWT>`.
2. `protect` verifies the token with the configured JWT secret.
3. The middleware reloads the user from MongoDB, so deleted or deactivated users lose access immediately.
4. `restrictTo(...)` checks the user's role for role-specific routes.
5. Customer and transaction services perform an additional ownership check using `customer.adminId` and `req.user.id`.

The frontend hides screens based on role, but the backend is the source of truth for authorization.

## 7. Data Model And Relationships

```text
User (SUPER_ADMIN or ADMIN)
  |
  | adminId
  v
Customer --------------------< Transaction >-------------------- Product
                                  |
                                  | adminId
                                  v
                                User

SystemConfig.updatedBy -> User
```

### User

Main fields:

- `name`, `email`, `mobile`, `profileImage`
- `password` (stored as a bcrypt hash and excluded from JSON responses)
- `role`: `SUPER_ADMIN` or `ADMIN`
- `status`: `ACTIVE` or `INACTIVE`
- timestamps

Emails are normalized to lowercase and must be unique.

### Customer

Main fields:

- `name`, `mobile`, `address`
- `adharNumber`, `panNumber`
- `image`, `profileImage`
- `adminId`: assigned User reference
- `qrToken`: unique lookup token
- `qrCode`: generated QR image data URL
- `status`: `ACTIVE` or `INACTIVE`
- timestamps

### Product

Main fields:

- `name`, `category`, `unit`
- `price`: non-negative current catalog price
- `status`: `ACTIVE` or `INACTIVE`
- timestamps

Product names are treated as case-insensitively unique by the product service.

### Transaction

Main fields:

- `customerId`: customer reference
- `adminId`: admin who recorded the delivery
- `productId`: product reference
- `productName`: product name snapshot
- `quantity`: must be greater than zero
- `unit`: unit snapshot
- `priceAtTransaction`: price snapshot
- `totalAmount`: calculated server-side
- `notes`
- timestamps

The snapshot fields are intentional. If a product price changes later, old bills remain correct.

### SystemConfig

This is a singleton-style configuration document containing organization name, logo/profile image, tagline, phone, address, and categories. It also records the user who last changed it.

## 8. API Endpoint Catalog

All paths below are relative to `/api`.

### Public endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check and service metadata |
| `POST` | `/auth/login` | Validate credentials and issue a JWT |
| `GET` | `/system-config` | Read organization configuration |
| `POST` | `/upload` | Upload a file or accept a file URL; currently not protected |

### Authentication

| Method | Path | Access | Purpose |
|---|---|---|
| `POST` | `/auth/logout` | Authenticated | Return logout confirmation; JWT invalidation is handled by the client removing its token |
| `GET` | `/auth/me` | Authenticated | Return the current user profile |

### Admin management

| Method | Path | Access | Purpose |
|---|---|---|
| `POST` | `/admins` | Super Admin | Create an Admin |
| `GET` | `/admins` | Super Admin | List admins with filters, pagination, and customer counts |
| `GET` | `/admins/:id` | Super Admin | Get admin details and assigned customers |
| `PUT` | `/admins/:id` | Super Admin | Update admin profile, password, or status |
| `DELETE` | `/admins/:id` | Super Admin | Delete an admin when customers are not assigned to them |

### Customer management and QR

| Method | Path | Access | Purpose |
|---|---|---|
| `POST` | `/customers` | Authenticated | Create a customer and generate a QR token/image |
| `GET` | `/customers` | Authenticated | List customers; Admin results are ownership-filtered |
| `GET` | `/customers/:id` | Authenticated | Read one customer with ownership enforcement |
| `PUT` | `/customers/:id` | Authenticated | Update customer; only Super Admin can reassign the admin |
| `DELETE` | `/customers/:id` | Authenticated | Delete a customer with ownership enforcement |
| `GET` | `/customers/qr/:qrToken` | Authenticated | Find a customer by QR token, supported identifier, or mobile |
| `POST` | `/customers/:id/regenerate-qr` | Authenticated | Replace the QR token and generated QR image |
| `GET` | `/customers/:customerId/transactions` | Authenticated | Read customer history, totals, and optional date filters |

QR lookup accepts a normalized token and also supports compatible embedded tokens, MongoDB IDs, and 10-digit mobile numbers. The QR itself is a lookup key and does not contain sensitive customer data.

### Products

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/products` | Authenticated | List, search, and filter products |
| `GET` | `/products/:id` | Authenticated | Read one product |
| `POST` | `/products` | Super Admin | Create a product |
| `PUT` | `/products/:id` | Super Admin | Update product details, price, or status |
| `DELETE` | `/products/:id` | Super Admin | Delete a product |

### Transactions

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/transactions` | Authenticated | Record a product delivery |
| `GET` | `/transactions` | Authenticated | List transactions with filters, summaries, and pagination |
| `GET` | `/transactions/:id` | Authenticated | Read one transaction; Admin ownership is checked |

There are currently no backend `PUT` or `DELETE` transaction routes. Any frontend action that tries to update or delete a transaction will receive `404` until those routes are implemented.

### System configuration

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/system-config` | Public | Read current configuration; defaults are created lazily |
| `PUT` | `/system-config` | Super Admin | Update organization configuration |

## 9. Main Business Flows

### Login flow

```text
Client submits email/password
        |
        v
Auth controller/service finds user
        |
        v
bcrypt compares the password hash
        |
        v
JWT is signed with user ID, role, and expiry
        |
        v
Client stores token and sends it on future requests
```

Inactive users, invalid credentials, expired tokens, deleted users, or malformed tokens are rejected.

### Customer and QR flow

1. A Super Admin or Admin creates a customer.
2. The service generates a unique QR token.
3. The QR service converts that token into a base64 PNG data URL.
4. The customer stores the token, image, and assigned admin ID.
5. An Admin scans the QR code.
6. The backend looks up the customer and checks ownership.
7. A matching Admin receives the customer profile; another Admin receives `403 Forbidden`.
8. A QR can be regenerated, which replaces the old token and QR image.

### Product delivery transaction flow

1. The client submits `customerId`, `productId`, `quantity`, and optional notes.
2. The service confirms the customer exists and is accessible to the current user.
3. The service confirms the product exists and is active.
4. The current product name, unit, and price are copied into the transaction.
5. The server calculates `totalAmount = quantity * priceAtTransaction` and rounds it to two decimals.
6. The transaction is saved with the recording admin ID.
7. Later product price changes do not alter this transaction.

Example calculation:

```text
Product price: 60 per litre
Quantity:      2 litres
Total:         2 x 60 = 120
```

### Admin isolation flow

```text
Admin A sends a customer or transaction request
        |
        v
Backend loads the requested customer
        |
        v
customer.adminId === req.user.id ?
        | yes                         | no
        v                             v
Continue operation               Return 403
```

Super Admins bypass this ownership restriction because they have organization-wide access.

## 10. Response And Error Format

Successful responses use a common envelope:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "meta": {}
}
```

Errors use:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": []
}
```

Typical status codes:

- `200`: successful read or update
- `201`: successful creation
- `400`: invalid request or validation failure
- `401`: missing, invalid, or expired authentication
- `403`: valid user but insufficient role or ownership
- `404`: resource or route not found
- `409`: duplicate or conflicting data
- `500`: unexpected server error

Pagination normally uses `page` and `limit`, with defaults of page `1` and limit `10`.

## 11. Frontend Integration

The frontend API wrapper is `frontend/src/services/api.js`.

- It builds the API base URL from `VITE_API_URL`, `VITE_BACKEND_URL`, or `/api`.
- It stores the JWT in browser `localStorage` under `token`.
- It adds the Bearer token to JSON requests.
- It parses the common response envelope and throws errors for non-2xx responses.
- On a `401`, it removes the token and emits `auth:expired`.
- The Vite development proxy can forward `/api` requests to the configured backend.

`AuthContext` restores a saved session through `/auth/me`. `App.jsx` renders the login view when there is no authenticated user, then selects the Super Admin or Admin dashboard based on the role.

The frontend includes screens for dashboards, QR scanning, customers, products, transactions, admins, and system settings.

## 12. File Uploads

The upload service supports multipart files, base64-style input, or an already supplied `fileUrl`.

- AWS S3 is used when valid S3 configuration is available.
- Local storage under `uploads/` is used as a fallback when S3 is unavailable or unconfigured.
- The application serves local files from `/uploads`.
- Supported files are restricted to configured image/PDF types and the limit is 10 MB.

The current upload route is public. Authentication headers may be sent by the frontend, but the route itself does not currently require `protect`.

## 13. Security And Operational Notes

Implemented protections include:

- Helmet security headers.
- JWT authentication and active-user checks.
- bcrypt password hashing.
- Joi and Mongoose validation.
- API and login rate limiting.
- Central error handling.
- Role checks and customer ownership checks.
- QR tokens that do not expose customer details.

Before production deployment, review these items:

- Replace the development JWT fallback secret.
- Restrict CORS to trusted frontend origins. `CORS_ORIGIN` is defined in configuration but the current app allows all origins.
- Protect `/api/upload` if uploads must be limited to authenticated users.
- Confirm that the frontend does not expose transaction edit/delete controls unless matching backend routes are added.
- Do not rely on the in-memory MongoDB fallback for production data.
- Rotate AWS credentials and keep all secrets outside source control.

## 14. Running The Software

From the repository root:

```bash
npm install
npm run dev
```

Run backend and frontend together:

```bash
npm run dev:all
```

Build the frontend:

```bash
npm run build:frontend
```

Seed demo data manually:

```bash
npm run seed
```

Run the backend test suite:

```bash
npm test
```

The development seed includes a Super Admin, two Admins, sample dairy products, customers with QR codes, and a sample transaction. Demo credentials are defined by the seed implementation and should not be reused in production.

## 15. Test Coverage

The Jest/Supertest tests cover the most important workflows:

- Authentication and JWT behavior.
- Super Admin and Admin permissions.
- Customer QR generation and lookup.
- Admin customer isolation.
- Product creation and updates.
- Transaction creation and price snapshots.
- Customer transaction history.
- Upload and system configuration behavior.

Useful future tests would cover public upload access, permissive CORS behavior, production configuration safety, and the frontend transaction actions that currently have no matching backend routes.

## 16. End-To-End Example

The normal operating sequence is:

```text
1. Super Admin logs in.
2. Super Admin creates an Admin.
3. Super Admin creates products and sets prices.
4. Super Admin creates a customer and assigns that customer to the Admin.
5. The Admin logs in.
6. The Admin scans the customer's QR code.
7. The backend verifies the Admin owns that customer.
8. The Admin selects a product and quantity.
9. The backend calculates the total and saves price snapshots.
10. The customer history and reports show the saved transaction.
11. A different Admin attempting the same QR or transaction receives 403.
```

This is the core business rule of the system: every delivery is tied to a customer, product, recording admin, and historical price, while customer data remains isolated between delivery admins.