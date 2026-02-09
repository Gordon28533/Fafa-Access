# Admin Laptop Product Management - Implementation Guide

## ✅ Secure Backend APIs for Laptop Management

### **Database Schema**

**Table**: `laptops`

```typescript
{
  id: UUID (primary key)
  brand: VARCHAR(100) - Laptop brand (required)
  model: VARCHAR(100) - Laptop model (required)
  processor: VARCHAR(100) - CPU specs (optional)
  ram: VARCHAR(50) - Memory specs (optional)
  storage: VARCHAR(50) - Storage specs (optional)
  screen: VARCHAR(50) - Display specs (optional)
  serialNumber: VARCHAR(100) - Unique identifier (required, unique)
  
  // Pricing in GHS (Ghana Cedis)
  originalPrice: REAL - Original price (required)
  discountedPrice: REAL - Discounted/selling price (required)
  
  // Inventory Management
  stockQuantity: INTEGER - Available units (default: 0)
  
  // Media
  imageUrl: VARCHAR(500) - Product image URL (optional)
  
  // Status
  isActive: BOOLEAN - Visible to students? (default: true)
  
  // Timestamps
  createdAt: TIMESTAMP (auto)
  updatedAt: TIMESTAMP (auto)
}
```

---

### **Authorization & Access Control**

#### **Role-Based Access**

| Endpoint | Method | Role | Access |
|----------|--------|------|--------|
| `/api/laptops` | GET | STUDENT | ✅ Active laptops only |
| `/api/laptops/:id` | GET | STUDENT | ✅ Active only |
| `/api/laptops/admin/all` | GET | ADMIN | ✅ All laptops |
| `/api/laptops/admin/summary` | GET | ADMIN | ✅ Inventory stats |
| `/api/laptops/admin` | POST | ADMIN | ✅ Create |
| `/api/laptops/admin/:id` | PATCH | ADMIN | ✅ Update |
| `/api/laptops/admin/:id` | DELETE | ADMIN | ✅ Deactivate |
| `/api/laptops/admin/:id/activate` | POST | ADMIN | ✅ Reactivate |
| `/api/laptops/admin/:id/adjust-stock` | POST | ADMIN | ✅ Adjust stock |

#### **Non-Admin Endpoint Protection**

All admin endpoints return **403 Forbidden** if accessed by non-admins:
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": ["Only administrators can [action]"]
}
```

---

### **API Endpoints**

#### **1. Get Active Laptops** (Student View)
```http
GET /api/laptops
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "message": "Active laptops retrieved",
  "data": {
    "laptops": [
      {
        "id": "uuid",
        "brand": "Dell",
        "model": "XPS 13",
        "processor": "Intel i5-11th Gen",
        "ram": "8GB",
        "storage": "512GB SSD",
        "screen": "13.4 inch FHD",
        "discountedPrice": 1299.99,
        "stockQuantity": 25,
        "imageUrl": "https://...",
        "isActive": true
      }
    ]
  }
}
```

#### **2. Get All Laptops** (Admin Only)
```http
GET /api/laptops/admin/all
Authorization: Bearer {accessToken}
X-Required-Role: ADMIN

Response: 200 OK
{
  "success": true,
  "data": {
    "laptops": [
      // All laptops including inactive
    ]
  }
}

Error: 403 Forbidden (if not admin)
```

#### **3. Get Inventory Summary** (Admin Only)
```http
GET /api/laptops/admin/summary
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "totalLaptops": 42,
    "activeLaptops": 38,
    "totalStock": 1850,
    "totalValue": 1250450.00
  }
}
```

#### **4. Create Laptop** (Admin Only)
```http
POST /api/laptops/admin
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "brand": "Dell",
  "model": "Inspiron 15",
  "processor": "AMD Ryzen 5",
  "ram": "16GB DDR4",
  "storage": "512GB SSD",
  "screen": "15.6 inch FHD",
  "serialNumber": "DL-2024-00001",
  "originalPrice": 899.99,
  "discountedPrice": 749.99,
  "stockQuantity": 50,
  "imageUrl": "https://..."
}

Response: 201 Created
{
  "success": true,
  "message": "Laptop created successfully",
  "data": {
    "laptop": {
      "id": "uuid",
      "brand": "Dell",
      // ... all fields
      "isActive": true,
      "createdAt": "2024-01-30T12:00:00Z"
    }
  }
}

Error: 400 Bad Request (validation errors)
Error: 409 Conflict (serial number already exists)
Error: 403 Forbidden (not admin)
```

#### **5. Update Laptop** (Admin Only)
```http
PATCH /api/laptops/admin/:id
Authorization: Bearer {accessToken}

{
  "stockQuantity": 45,
  "imageUrl": "https://new-image.jpg",
  "discountedPrice": 699.99
}

Response: 200 OK
{
  "success": true,
  "message": "Laptop updated successfully",
  "data": { "laptop": { /* updated fields */ } }
}
```

#### **6. Adjust Stock** (Admin Only)
```http
POST /api/laptops/admin/:id/adjust-stock
Authorization: Bearer {accessToken}

{
  "quantity": 10,
  "reason": "New shipment received"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "laptop": {
      "stockQuantity": 35,
      // ...
    }
  }
}

Error: 400 Bad Request (would result in negative stock)
{
  "success": false,
  "message": "Invalid stock adjustment",
  "errors": ["Cannot adjust stock below 0. Current: 5, Adjustment: -10, Result: -5"]
}
```

#### **7. Deactivate Laptop** (Admin Only)
```http
DELETE /api/laptops/admin/:id
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "message": "Laptop deactivated successfully",
  "data": {
    "laptop": {
      "id": "uuid",
      "isActive": false
      // ...
    }
  }
}
```

#### **8. Activate Laptop** (Admin Only)
```http
POST /api/laptops/admin/:id/activate
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "message": "Laptop activated successfully",
  "data": {
    "laptop": {
      "id": "uuid",
      "isActive": true
      // ...
    }
  }
}
```

---

### **Validation Rules**

#### **Creation & Update Validation**

✅ **Brand**
- Required (non-empty string)
- 2-100 characters
- Trimmed of whitespace

✅ **Model**
- Required (non-empty string)
- 1-100 characters
- Trimmed of whitespace

✅ **Serial Number**
- Required (non-empty string)
- Must be unique across all laptops
- Trimmed of whitespace

✅ **Pricing (GHS - Ghana Cedis)**
- Both originalPrice and discountedPrice required
- Must be numbers
- Must be between 0.01 and 999,999.99 GHS
- Discounted price ≤ original price
- Warnings if discount > 90%

✅ **Stock Quantity**
- Optional (defaults to 0)
- Must be integer
- Must be between 0 and 10,000

✅ **Specs (Processor, RAM, Storage, Screen)**
- Optional
- If provided, must be string

✅ **Image URL**
- Optional
- Must be valid HTTP/HTTPS URL
- Must end with .jpg, .jpeg, .png, .gif, or .webp

#### **Stock Adjustment Validation**

✅ Must be integer
✅ New quantity >= 0
✅ New quantity <= 10,000
✅ Cannot result in negative stock

---

### **Error Responses**

#### **400 Bad Request - Validation Errors**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Brand must be between 2 and 100 characters",
    "Discounted price cannot exceed original price",
    "Stock quantity must be between 0 and 10000"
  ]
}
```

#### **403 Forbidden - Unauthorized**
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": ["Only administrators can create laptops"]
}
```

#### **404 Not Found**
```json
{
  "success": false,
  "message": "Not found",
  "errors": ["Laptop not found"]
}
```

#### **409 Conflict - Duplicate Serial Number**
```json
{
  "success": false,
  "message": "Conflict",
  "errors": ["Laptop with serial number \"ABC123\" already exists"]
}
```

---

### **Security Implementation**

✅ **Admin-Only Enforcement**
- All write operations (`POST`, `PATCH`, `DELETE`) require `ADMIN` role
- Role verified before any database operation
- Unauthorized requests logged for audit trail

✅ **Input Validation**
- Type checking (strings, numbers, integers)
- Length constraints
- Price range validation
- Stock range validation
- URL format validation

✅ **Data Integrity**
- Serial number uniqueness enforced at DB and API level
- Stock cannot go negative
- Prices validated before update
- Timestamps auto-managed

✅ **Audit Logging**
- All admin actions logged (create, update, delete, stock adjustment)
- Includes admin user ID, changes made, timestamp
- Unauthorized attempts logged

✅ **Student Privacy**
- Students only see active laptops
- Inactive products hidden until reactivated
- No access to admin endpoints

---

### **Usage Examples**

#### **Create New Laptop**
```bash
curl -X POST http://localhost:3000/api/laptops/admin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "HP",
    "model": "Pavilion 15",
    "processor": "Intel i7-11th Gen",
    "ram": "16GB DDR4",
    "storage": "512GB SSD",
    "screen": "15.6 inch FHD",
    "serialNumber": "HP-2024-00001",
    "originalPrice": 1099.99,
    "discountedPrice": 899.99,
    "stockQuantity": 30,
    "imageUrl": "https://example.com/hp-pavilion.jpg"
  }'
```

#### **Adjust Stock After Sale**
```bash
curl -X POST http://localhost:3000/api/laptops/admin/{laptop_id}/adjust-stock \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": -1,
    "reason": "Sold to student APP-2024-0001"
  }'
```

#### **Deactivate Out-of-Stock Model**
```bash
curl -X DELETE http://localhost:3000/api/laptops/admin/{laptop_id} \
  -H "Authorization: Bearer {token}"
```

---

### **Integration Points**

#### **Frontend - Laptop Service**
```javascript
// src/services/laptopService.js
async getActiveLaptops() {
  const response = await authFetch('/api/laptops');
  return response.json();
}

async createLaptop(data) {
  const response = await authFetch('/api/laptops/admin', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}

async updateLaptop(id, data) {
  const response = await authFetch(`/api/laptops/admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return response.json();
}

async adjustStock(id, quantity, reason) {
  const response = await authFetch(`/api/laptops/admin/${id}/adjust-stock`, {
    method: 'POST',
    body: JSON.stringify({ quantity, reason })
  });
  return response.json();
}
```

---

## ✅ Implementation Status

- ✅ Secure database schema
- ✅ Admin-only authorization on all write operations
- ✅ Comprehensive input validation
- ✅ GHS pricing support
- ✅ Stock management with bounds checking
- ✅ Image URL support
- ✅ Soft-delete (inactive) system
- ✅ Serial number uniqueness
- ✅ Audit logging
- ✅ Student visibility filtering
- ✅ Role-based access control
- ✅ Error handling with specific messages
- ✅ Validation service for reusability

---

## 🔒 Security Summary

**No vulnerabilities:**
- ✅ Students cannot access admin endpoints (403 Forbidden)
- ✅ SRC officers cannot access admin endpoints (403 Forbidden)
- ✅ All non-admin requests rejected with proper error messages
- ✅ Input validation prevents injection attacks
- ✅ Serial number uniqueness prevents duplicates
- ✅ Stock bounds prevent impossible states
- ✅ Admin actions logged for audit trail
