# SRC Onboarding API Reference

**Version:** 1.0  
**Last Updated:** February 8, 2026  
**Base URL:** `https://api.fafaaccess.com` or `http://localhost:3000`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Endpoints](#admin-endpoints)
3. [Public Endpoints](#public-endpoints)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

### Admin Endpoints
All admin endpoints require:
- **Header:** `Authorization: Bearer {jwt_token}`
- **Role:** ADMIN

### Public Endpoints
Public endpoints (acceptance flow) require:
- **No authentication** for GET invitation details and POST accept
- **Token-based validation** (invite token in URL or body)

---

## Admin Endpoints

### 1. Create SRC Invitation

Create and send a new SRC officer invitation.

**Endpoint:**
```http
POST /api/admin/src/invitations
```

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "universityId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@university.edu",
  "phone": "+233123456789"
}
```

**Field Validation:**
- `universityId` (required): Valid UUID, must exist in universities table
- `firstName` (required): 1-100 characters
- `lastName` (required): 1-100 characters
- `email` (required): Valid email format, must be unique
- `phone` (optional): 1-20 characters

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "SRC invitation created successfully",
  "data": {
    "invitation": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "universityId": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@university.edu",
      "phone": "+233123456789",
      "inviteToken": "a1b2c3d4e5f6...64-char-hex",
      "tokenExpiry": "2026-02-15T12:00:00.000Z",
      "isExpired": false,
      "agreementAccepted": false,
      "agreementAcceptedAt": null,
      "accountCreated": false,
      "createdUserId": null,
      "invitedBy": "admin-user-id",
      "createdAt": "2026-02-08T12:00:00.000Z",
      "updatedAt": "2026-02-08T12:00:00.000Z"
    },
    "inviteLink": "https://app.fafaaccess.com/src/accept/a1b2c3d4e5f6...64-char-hex"
  }
}
```

**Error Responses:**

`400 Bad Request` - Validation error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format"
  }
}
```

`404 Not Found` - University not found
```json
{
  "success": false,
  "error": "University not found",
  "message": "University with ID 550e8400-e29b-41d4-a716-446655440000 does not exist"
}
```

`409 Conflict` - Email already invited
```json
{
  "success": false,
  "error": "Email already invited",
  "message": "An invitation has already been sent to john.doe@university.edu"
}
```

---

### 2. Get Pending Invitations

Retrieve list of SRC invitations with filtering and sorting.

**Endpoint:**
```http
GET /api/admin/src/invitations
```

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Query Parameters:**
- `universityId` (optional): Filter by university UUID
- `accepted` (optional): `true` | `false` - Filter by agreement acceptance status
- `sortBy` (optional): `email` | `createdAt` | `university` - Default: `createdAt`
- `sortOrder` (optional): `asc` | `desc` - Default: `desc`

**Example Requests:**
```http
# Get all invitations
GET /api/admin/src/invitations

# Get invitations for specific university
GET /api/admin/src/invitations?universityId=550e8400-e29b-41d4-a716-446655440000

# Get invitations that haven't accepted yet
GET /api/admin/src/invitations?accepted=false

# Get accepted invitations sorted by email
GET /api/admin/src/invitations?accepted=true&sortBy=email&sortOrder=asc
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "universityId": "550e8400-e29b-41d4-a716-446655440000",
        "universityName": "University of Ghana",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@university.edu",
        "phone": "+233123456789",
        "status": "active",
        "agreementAccepted": true,
        "agreementAcceptedAt": "2026-02-10T15:30:00.000Z",
        "accountCreated": false,
        "tokenExpiry": "2026-02-15T12:00:00.000Z",
        "isExpired": false,
        "createdAt": "2026-02-08T12:00:00.000Z"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "universityId": "550e8400-e29b-41d4-a716-446655440000",
        "universityName": "University of Ghana",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@university.edu",
        "phone": "+233987654321",
        "status": "active",
        "agreementAccepted": false,
        "agreementAcceptedAt": null,
        "accountCreated": false,
        "tokenExpiry": "2026-02-15T14:00:00.000Z",
        "isExpired": false,
        "createdAt": "2026-02-08T14:00:00.000Z"
      }
    ],
    "stats": {
      "total": 10,
      "pending": 5,
      "accepted": 3,
      "created": 2,
      "expired": 1
    }
  }
}
```

---

### 3. Get Single SRC Invitation

Retrieve details of a specific SRC invitation.

**Endpoint:**
```http
GET /api/admin/src/invitations/{id}
```

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Path Parameters:**
- `id` (required): UUID of the invitation

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "universityId": "550e8400-e29b-41d4-a716-446655440000",
      "universityName": "University of Ghana",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@university.edu",
      "phone": "+233123456789",
      "inviteToken": "a1b2c3d4e5f6...64-char-hex",
      "tokenExpiry": "2026-02-15T12:00:00.000Z",
      "isExpired": false,
      "agreementAccepted": true,
      "agreementAcceptedAt": "2026-02-10T15:30:00.000Z",
      "accountCreated": false,
      "createdUserId": null,
      "invitedBy": "admin-user-id",
      "createdAt": "2026-02-08T12:00:00.000Z",
      "updatedAt": "2026-02-10T15:30:00.000Z"
    }
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Invitation not found",
  "message": "No invitation found with ID 660e8400-e29b-41d4-a716-446655440000"
}
```

---

### 4. Resend Invitation

Resend invitation with a new token and expiry. Sends a new email automatically.

**Endpoint:**
```http
PATCH /api/admin/src/invitations/{id}/resend
```

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Path Parameters:**
- `id` (required): UUID of the invitation to resend

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invitation resent successfully",
  "data": {
    "invitation": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@university.edu",
      "inviteToken": "x9y8z7w6v5u4...new-64-char-hex",
      "tokenExpiry": "2026-02-22T16:00:00.000Z",
      "isExpired": false,
      "updatedAt": "2026-02-15T16:00:00.000Z"
    },
    "inviteLink": "https://app.fafaaccess.com/src/accept/x9y8z7w6v5u4...new-64-char-hex"
  }
}
```

**Error Responses:**

`404 Not Found` - Invitation not found or already expired
```json
{
  "success": false,
  "error": "Invitation not found or expired",
  "message": "Cannot resend invitation that has expired or doesn't exist"
}
```

`409 Conflict` - Account already created
```json
{
  "success": false,
  "error": "Cannot resend invitation",
  "message": "Invitation has already been used to create an account"
}
```

---

### 5. Cancel Invitation

Cancel an active invitation by marking it as expired.

**Endpoint:**
```http
DELETE /api/admin/src/invitations/{id}
```

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Path Parameters:**
- `id` (required): UUID of the invitation to cancel

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invitation cancelled successfully"
}
```

**Error Responses:**

`404 Not Found`
```json
{
  "success": false,
  "error": "Invitation not found",
  "message": "No invitation found with ID 660e8400-e29b-41d4-a716-446655440000"
}
```

`409 Conflict` - Already expired or account created
```json
{
  "success": false,
  "error": "Cannot cancel invitation",
  "message": "Invitation is already expired or has been used to create an account"
}
```

---

### 6. Get SRC Statistics

Get overall statistics for SRC invitations.

**Endpoint:**
```http
GET /api/admin/src/statistics
```

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 25,
      "pending": 10,
      "accepted": 8,
      "created": 5,
      "expired": 2
    }
  }
}
```

**Explanation:**
- `total`: Total number of invitations ever sent
- `pending`: Invitations awaiting agreement acceptance (not expired)
- `accepted`: Invitations with accepted agreements (awaiting account creation)
- `created`: Invitations that resulted in account creation
- `expired`: Invitations that have expired (isExpired=true OR tokenExpiry < NOW)

---

## Public Endpoints

### 1. Get Invitation Details

Retrieve invitation details for displaying the agreement page. PUBLIC - no authentication required.

**Endpoint:**
```http
GET /api/src/invitations/{token}
```

**Headers:** None required

**Path Parameters:**
- `token` (required): 64-character hex invite token from email link

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@university.edu",
      "phone": "+233123456789",
      "universityName": "University of Ghana",
      "tokenExpiry": "2026-02-15T12:00:00.000Z",
      "agreementAccepted": false
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Invalid token format
```json
{
  "success": false,
  "error": "Invalid token format",
  "message": "Invite token must be at least 64 characters"
}
```

`404 Not Found` - Token not found, invalid, or expired
```json
{
  "success": false,
  "error": "Invitation not found or expired",
  "message": "The invitation link is invalid or has expired. Please contact your administrator to request a new invitation.",
  "helpMessage": "If you believe this is an error, please contact admin-support@fafaaccess.com"
}
```

---

### 2. Accept Agreement

Accept the partnership agreement for an SRC invitation. PUBLIC - no authentication required.

**Endpoint:**
```http
POST /api/src/accept
```

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6...64-char-hex",
  "agree": true
}
```

**Field Validation:**
- `token` (required): 64-character hex invite token
- `agree` (required): Must be `true` to proceed

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Partnership agreement accepted successfully",
  "data": {
    "inviteId": "660e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@university.edu",
    "nextSteps": "Admin will review your information and contact you within 24 hours to complete your account setup. Please check your email for further instructions."
  }
}
```

**Error Responses:**

`400 Bad Request` - Agreement not accepted
```json
{
  "success": false,
  "error": "Agreement not accepted",
  "message": "You must accept the partnership agreement to proceed. Please check the 'I agree' checkbox."
}
```

`404 Not Found` - Token not found or expired
```json
{
  "success": false,
  "error": "Invitation not found or expired",
  "message": "The invitation link is invalid or has expired. Please contact your administrator to request a new invitation."
}
```

`409 Conflict` - Agreement already accepted
```json
{
  "success": false,
  "error": "Agreement already accepted",
  "message": "You have already accepted this partnership agreement. Admin will contact you soon."
}
```

---

### 3. Check Invitation Status

Check the acceptance and account creation status of an invitation. AUTHENTICATED - requires valid JWT.

**Endpoint:**
```http
GET /api/src/status/{inviteId}
```

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `inviteId` (required): UUID of the invitation

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": {
      "agreementAccepted": true,
      "acceptedAt": "2026-02-10T15:30:00.000Z",
      "accountCreated": false,
      "isExpired": false
    }
  }
}
```

**Error Responses:**

`401 Unauthorized` - Missing or invalid JWT
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication token required"
}
```

`404 Not Found` - Invitation not found
```json
{
  "success": false,
  "error": "Invitation not found",
  "message": "No invitation found with ID 660e8400-e29b-41d4-a716-446655440000"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Name | Meaning |
|------|------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or invalid input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Application Error Codes

| Error | Description |
|-------|-------------|
| VALIDATION_ERROR | Input validation failed |
| DUPLICATE_ENTRY | Email or token already exists |
| NOT_FOUND | Resource not found in database |
| INVALID_TOKEN | Token format invalid or not found |
| TOKEN_EXPIRED | Token expiry date has passed |
| ALREADY_ACCEPTED | Agreement already accepted |
| ALREADY_CREATED | Account already created from this invitation |
| UNAUTHORIZED | Missing or invalid JWT token |
| FORBIDDEN | User lacks required role (ADMIN) |

---

## Data Models

### SRC Invitation Object

```typescript
{
  id: string;                      // UUID
  universityId: string;            // UUID, foreign key to universities
  universityName?: string;         // Populated from join
  firstName: string;               // 1-100 characters
  lastName: string;                // 1-100 characters
  email: string;                   // Valid email, unique
  phone: string | null;            // 1-20 characters, optional
  inviteToken: string;             // 64-character hex, unique
  tokenExpiry: string;             // ISO8601 datetime
  isExpired: boolean;              // Soft delete flag
  agreementAccepted: boolean;      // False until SRC accepts
  agreementAcceptedAt: string | null; // ISO8601 datetime
  accountCreated: boolean;         // False until admin creates account
  createdUserId: string | null;    // UUID, foreign key to users
  invitedBy: string | null;        // UUID of admin who created invite
  createdAt: string;               // ISO8601 datetime
  updatedAt: string;               // ISO8601 datetime
}
```

### Statistics Object

```typescript
{
  total: number;        // All invitations ever sent
  pending: number;      // Awaiting agreement acceptance
  accepted: number;     // Agreement accepted
  created: number;      // Accounts created
  expired: number;      // Tokens expired
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:

### Global Limit
- **Production:** 100 requests per 15 minutes
- **Development:** 1000 requests per 15 minutes

### API Limit
- **Production:** 30 requests per minute
- **Development:** 100 requests per minute

### Headers Returned
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1707398400
```

**429 Too Many Requests Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later."
}
```

---

## Examples

### Complete Workflow Example

#### Step 1: Admin Creates Invitation

```bash
curl -X POST http://localhost:3000/api/admin/src/invitations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@university.edu",
    "phone": "+233123456789"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "SRC invitation created successfully",
  "data": {
    "invitation": { ... },
    "inviteLink": "https://app.fafaaccess.com/src/accept/a1b2c3d4e5f6..."
  }
}
```

#### Step 2: SRC Gets Invitation Details

```bash
curl http://localhost:3000/api/src/invitations/a1b2c3d4e5f6...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@university.edu",
      "universityName": "University of Ghana",
      "tokenExpiry": "2026-02-15T12:00:00.000Z",
      "agreementAccepted": false
    }
  }
}
```

#### Step 3: SRC Accepts Agreement

```bash
curl -X POST http://localhost:3000/api/src/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6...",
    "agree": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partnership agreement accepted successfully",
  "data": {
    "inviteId": "660e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@university.edu",
    "nextSteps": "Admin will review your information and contact you within 24 hours..."
  }
}
```

#### Step 4: Admin Checks Statistics

```bash
curl http://localhost:3000/api/admin/src/statistics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 1,
      "pending": 0,
      "accepted": 1,
      "created": 0,
      "expired": 0
    }
  }
}
```

---

## Testing with Postman

### Import Collection

Create a Postman collection with these requests:

1. **Admin: Create Invitation**
   - Method: POST
   - URL: `{{baseUrl}}/api/admin/src/invitations`
   - Headers: `Authorization: Bearer {{adminToken}}`
   - Body: Raw JSON (see example above)

2. **Admin: Get All Invitations**
   - Method: GET
   - URL: `{{baseUrl}}/api/admin/src/invitations`
   - Headers: `Authorization: Bearer {{adminToken}}`

3. **Public: Get Invitation Details**
   - Method: GET
   - URL: `{{baseUrl}}/api/src/invitations/{{inviteToken}}`
   - No auth required

4. **Public: Accept Agreement**
   - Method: POST
   - URL: `{{baseUrl}}/api/src/accept`
   - Body: Raw JSON `{"token": "{{inviteToken}}", "agree": true}`

5. **Admin: Resend Invitation**
   - Method: PATCH
   - URL: `{{baseUrl}}/api/admin/src/invitations/{{inviteId}}/resend`
   - Headers: `Authorization: Bearer {{adminToken}}`

6. **Admin: Cancel Invitation**
   - Method: DELETE
   - URL: `{{baseUrl}}/api/admin/src/invitations/{{inviteId}}`
   - Headers: `Authorization: Bearer {{adminToken}}`

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "adminToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "inviteToken": "generated-from-create-response",
  "inviteId": "generated-from-create-response"
}
```

---

**API Version:** 1.0  
**Last Updated:** February 8, 2026  
**Status:** Production Ready ✅
