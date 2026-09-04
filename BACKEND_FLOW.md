# Backend Flow & Step-by-Step API Guide — Customer QR & Milk Management

This guide documents the complete business workflow of the backend with real JSON payloads, cURL commands, and responses.

---

## 📌 Complete Architecture Flow Diagram

```
1. SUPER ADMIN (admin@dairy.com)
   │
   ├── [POST /api/auth/login] ──────────► Receive JWT Token (Role: SUPER_ADMIN)
   │
   ├── [POST /api/admins] ──────────────► Create Admin A (Rajesh) & Admin B (Sunil)
   │
   ├── [POST /api/products] ────────────► Create Products: Milk ₹60/L, Paneer ₹400/kg
   │
   └── [POST /api/customers] ───────────► Create Customer "Rahul", assigned to Admin A
                                          (Auto-generates qrToken: "CUST_8F72K91X" + QR image)
                                          │
                                          ▼
2. DELIVERY ROUTE EXECUTION
   │
   ├── [POST /api/auth/login] ──────────► Admin A logs in (Role: ADMIN)
   │
   ├── [GET /api/customers/qr/:token] ──► Admin A scans Rahul's QR code
   │                                      Backend verifies: rahul.adminId === adminA.id (MATCH!)
   │                                      Returns Customer Profile
   │
   ├── [POST /api/transactions] ────────► Admin A gives 2L Milk to Rahul
   │                                      Backend calculates: 2 × ₹60 = ₹120
   │                                      Saves immutable priceAtTransaction: 60
   │
   └── [GET /api/customers/:id/tx] ─────► View Rahul's historical distribution ledger
                                          │
                                          ▼
3. STRICT ADMIN ISOLATION TEST
   │
   └── [GET /api/customers/qr/:token] ──► Admin B tries to scan Rahul's QR code
                                          Backend checks: rahul.adminId === adminB.id (MISMATCH!)
                                          Returns HTTP 403 Forbidden!
```

---

## 🚀 Step-by-Step API Execution Examples

### Step 1: Super Admin Login

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dairy.com",
    "password": "Admin@12345"
  }'
```

**Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
    "user": {
      "id": "64d0a1b2c3d4e5f601",
      "name": "Super Administrator",
      "email": "admin@dairy.com",
      "role": "SUPER_ADMIN",
      "status": "ACTIVE"
    }
  }
}
```

*Save this token as `SUPER_ADMIN_TOKEN`.*

---

### Step 2: Create a Delivery Admin (Admin A)

**Request:**
```bash
curl -X POST http://localhost:5000/api/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -d '{
    "name": "Rajesh Kumar (Admin A)",
    "email": "admin.rajesh@dairy.com",
    "password": "Admin@12345",
    "mobile": "9876543211"
  }'
```

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": {
      "_id": "64d0a1b2c3d4e5f602",
      "name": "Rajesh Kumar (Admin A)",
      "email": "admin.rajesh@dairy.com",
      "mobile": "9876543211",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  }
}
```

*Admin A ID is `64d0a1b2c3d4e5f602`.*

---

### Step 3: Create Products (Milk & Paneer)

**Request:**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -d '{
    "name": "Cow Fresh Milk",
    "category": "Dairy",
    "unit": "litre",
    "price": 60
  }'
```

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "64d0a1b2c3d4e5f610",
      "name": "Cow Fresh Milk",
      "unit": "litre",
      "price": 60,
      "status": "ACTIVE"
    }
  }
}
```

*Product ID is `64d0a1b2c3d4e5f610`.*

---

### Step 4: Register Customer & Auto-Generate Unique QR

**Request:**
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -d '{
    "name": "Rahul Sharma",
    "mobile": "9988776601",
    "address": "Flat 302, Sector 4",
    "adminId": "64d0a1b2c3d4e5f602"
  }'
```

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "Customer created successfully with QR code",
  "data": {
    "customer": {
      "_id": "64d0a1b2c3d4e5f620",
      "name": "Rahul Sharma",
      "mobile": "9988776601",
      "address": "Flat 302, Sector 4",
      "adminId": "64d0a1b2c3d4e5f602",
      "qrToken": "CUST_8F72K91X",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
      "status": "ACTIVE"
    }
  }
}
```

*Notice:*
- `qrToken` is a random, collision-free token (`CUST_8F72K91X`).
- `qrCode` is a high-resolution base64 PNG data URL.
- Customer is strictly linked to Admin A (`64d0a1b2c3d4e5f602`).

---

### Step 5: Admin A Logs In

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.rajesh@dairy.com",
    "password": "Admin@12345"
  }'
```

**Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ADMIN_A...",
    "user": {
      "id": "64d0a1b2c3d4e5f602",
      "name": "Rajesh Kumar (Admin A)",
      "role": "ADMIN"
    }
  }
}
```

*Save this token as `ADMIN_A_TOKEN`.*

---

### Step 6: Admin A Scans Rahul's QR Code Pass

**Request:**
```bash
curl -X GET http://localhost:5000/api/customers/qr/CUST_8F72K91X \
  -H "Authorization: Bearer <ADMIN_A_TOKEN>"
```

**Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Customer QR scan verified successfully",
  "data": {
    "customer": {
      "_id": "64d0a1b2c3d4e5f620",
      "name": "Rahul Sharma",
      "mobile": "9988776601",
      "adminId": {
        "_id": "64d0a1b2c3d4e5f602",
        "name": "Rajesh Kumar (Admin A)"
      },
      "qrToken": "CUST_8F72K91X",
      "status": "ACTIVE"
    }
  }
}
```

---

### Step 7: Strict Admin Isolation Test (Admin B Scans Rahul's QR)

Admin B (`admin.sunil@dairy.com`) attempts to scan Rahul's QR code:

**Request:**
```bash
curl -X GET http://localhost:5000/api/customers/qr/CUST_8F72K91X \
  -H "Authorization: Bearer <ADMIN_B_TOKEN>"
```

**Response (HTTP 403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied: You are not authorized to access this customer."
}
```

*Admin B is strictly blocked from accessing Rahul's data!*

---

### Step 8: Admin A Records Milk Given to Rahul

Admin A records 2 Litres of Milk for Rahul.

**Request:**
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_A_TOKEN>" \
  -d '{
    "customerId": "64d0a1b2c3d4e5f620",
    "productId": "64d0a1b2c3d4e5f610",
    "quantity": 2,
    "notes": "Morning milk delivery"
  }'
```

**Backend Process:**
1. Verifies `customerId.adminId === req.user.id` (Admin A).
2. Gets active price of product `Cow Fresh Milk` = ₹60.
3. Calculates `totalAmount = 2 × 60 = ₹120`.
4. Stores frozen `priceAtTransaction: 60`.

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "Transaction recorded successfully",
  "data": {
    "transaction": {
      "_id": "64d0a1b2c3d4e5f630",
      "customerId": "64d0a1b2c3d4e5f620",
      "adminId": "64d0a1b2c3d4e5f602",
      "productId": "64d0a1b2c3d4e5f610",
      "productName": "Cow Fresh Milk",
      "quantity": 2,
      "unit": "litre",
      "priceAtTransaction": 60,
      "totalAmount": 120,
      "notes": "Morning milk delivery",
      "createdAt": "2026-09-02T10:00:00.000Z"
    }
  }
}
```

---

### Step 9: View Customer Distribution History

**Request:**
```bash
curl -X GET http://localhost:5000/api/customers/64d0a1b2c3d4e5f620/transactions \
  -H "Authorization: Bearer <ADMIN_A_TOKEN>"
```

**Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Customer transaction history retrieved successfully",
  "data": {
    "customer": {
      "id": "64d0a1b2c3d4e5f620",
      "name": "Rahul Sharma",
      "mobile": "9988776601",
      "qrToken": "CUST_8F72K91X"
    },
    "summary": {
      "totalSpent": 120,
      "totalTransactions": 1
    },
    "transactions": [
      {
        "_id": "64d0a1b2c3d4e5f630",
        "productName": "Cow Fresh Milk",
        "quantity": 2,
        "unit": "litre",
        "priceAtTransaction": 60,
        "totalAmount": 120,
        "createdAt": "2026-09-02T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Step 10: Price Snapshot Guarantee (Price Change Test)

Super Admin changes Cow Fresh Milk price from ₹60 to ₹75:

```bash
curl -X PUT http://localhost:5000/api/products/64d0a1b2c3d4e5f610 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -d '{ "price": 75 }'
```

- When you query the previous transaction (Step 9), its `priceAtTransaction` is **STILL 60** and `totalAmount` is **STILL 120**.
- When Admin A creates a *new* transaction for 2L, the new transaction will calculate `2 × 75 = ₹150`.
- Historical billing is 100% frozen and tamper-proof.
