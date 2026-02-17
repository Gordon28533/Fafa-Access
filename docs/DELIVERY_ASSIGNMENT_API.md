# Delivery Assignment API - Quick Reference

## Endpoint

```
POST /api/applications/:id/assign-delivery
```

## Authentication

Requires **ADMIN** role.

## Request

### Headers
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

### Path Parameters
- `id` (UUID) - Application ID to assign delivery for

### Body
```json
{
  "staffName": "string (required) - Name of delivery staff",
  "deliveryDate": "string (required) - ISO date (YYYY-MM-DD)",
  "location": "string (required) - Delivery location"
}
```

### Example Request
```bash
curl -X POST http://localhost:3000/api/applications/abc123-def456/assign-delivery \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "staffName": "John Mensah",
    "deliveryDate": "2024-02-15",
    "location": "Main Campus, Near Library"
  }'
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Delivery assigned successfully",
  "data": {
    "delivery": {
      "id": "delivery-uuid",
      "applicationId": "application-uuid",
      "staffName": "John Mensah",
      "deliveryDate": "2024-02-15T00:00:00.000Z",
      "location": "Main Campus, Near Library",
      "delivered": false,
      "paymentConfirmed": false,
      "createdAt": "2024-02-06T10:30:00.000Z"
    }
  }
}
```

### Error Responses

#### 400 - Missing Required Fields
```json
{
  "success": false,
  "message": "Missing required fields",
  "errors": ["staffName, deliveryDate, and location are required"]
}
```

#### 400 - Invalid Status
```json
{
  "success": false,
  "message": "Cannot assign delivery",
  "errors": ["Application must be admin approved before delivery assignment"]
}
```

#### 404 - Application Not Found
```json
{
  "success": false,
  "message": "Application not found",
  "errors": ["Application does not exist"]
}
```

#### 409 - Already Assigned
```json
{
  "success": false,
  "message": "Delivery already assigned",
  "errors": ["This application already has a delivery assignment"]
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "message": "Failed to assign delivery",
  "errors": ["Internal server error details"]
}
```

## Workflow

### Before Assignment
1. Application must be in `ADMIN_APPROVED` status
2. No existing delivery assignment for this application

### During Assignment
1. Creates delivery record in database
2. Updates application status to `DELIVERY_ASSIGNED`
3. Logs status transition in history
4. Creates audit log entry
5. **Sends `deliveryScheduled` email to student** ✉️

### After Assignment
- Application status: `DELIVERY_ASSIGNED`
- Student receives email with:
  - Delivery date and time window
  - Delivery staff name
  - Delivery location
  - Contact information
  - Dashboard link

## Email Notification

**Template:** `deliveryScheduled`  
**Recipient:** Student (application owner)  
**Variables:**
- Student name
- Application reference
- Delivery date (formatted: DD/MM/YYYY)
- Delivery time window (9:00 AM - 5:00 PM)
- Agent name
- Location
- Agent phone (from `DELIVERY_CONTACT_PHONE` env var)
- Dashboard URL

**Sample Email:**
```
Subject: Laptop Delivery Scheduled - APP-2024-0001

Dear John Doe,

Great news! Your laptop delivery has been scheduled.

Delivery Details:
- Date: 15/02/2024
- Time: 9:00 AM - 5:00 PM
- Location: Main Campus, Near Library

Delivery Agent:
- Name: John Mensah
- Phone: +233-XXX-XXX-XXX

Please ensure you are available at the specified location during the delivery window.

View your application status: https://app.fafaaccess.edu.gh/dashboard

Thank you,
Fafa Access Team
```

## Database Changes

### `deliveries` Table (New Record)
```sql
INSERT INTO deliveries (
  id,
  application_id,
  staff_name,
  delivery_date,
  location,
  delivered,
  payment_confirmed,
  created_at
) VALUES (
  'uuid',
  'application-id',
  'John Mensah',
  '2024-02-15 00:00:00',
  'Main Campus, Near Library',
  false,
  false,
  NOW()
);
```

### `applications` Table (Updated)
```sql
UPDATE applications 
SET 
  status = 'DELIVERY_ASSIGNED',
  updated_at = NOW()
WHERE id = 'application-id';
```

### `application_status_history` Table (New Entry)
```sql
INSERT INTO application_status_history (
  application_id,
  status,
  changed_by,
  timestamp
) VALUES (
  'application-id',
  'DELIVERY_ASSIGNED',
  'admin-user-id',
  NOW()
);
```

### `audit_logs` Table (New Entry)
```sql
INSERT INTO audit_logs (
  action,
  actor_id,
  resource_type,
  resource_id,
  details,
  timestamp
) VALUES (
  'DELIVERY_ASSIGNED',
  'admin-user-id',
  'application',
  'application-id',
  '{"staffName": "John Mensah", "deliveryDate": "2024-02-15", ...}',
  NOW()
);
```

## Testing

### 1. Successful Assignment
```javascript
// Prerequisites: Application in ADMIN_APPROVED status
const response = await fetch('http://localhost:3000/api/applications/abc123/assign-delivery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    staffName: 'Test Agent',
    deliveryDate: '2024-03-01',
    location: 'Test Location'
  })
});

const data = await response.json();
console.log(data.success); // true
console.log(data.data.delivery); // delivery object
```

### 2. Duplicate Assignment (Should Fail)
```javascript
// Try to assign again - should return 409
const response2 = await fetch('http://localhost:3000/api/applications/abc123/assign-delivery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    staffName: 'Another Agent',
    deliveryDate: '2024-03-02',
    location: 'Different Location'
  })
});

const data2 = await response2.json();
console.log(data2.success); // false
console.log(response2.status); // 409
```

### 3. Invalid Status (Should Fail)
```javascript
// Application not in ADMIN_APPROVED status
const response3 = await fetch('http://localhost:3000/api/applications/pending123/assign-delivery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    staffName: 'Test Agent',
    deliveryDate: '2024-03-01',
    location: 'Test Location'
  })
});

const data3 = await response3.json();
console.log(data3.success); // false
console.log(data3.message); // "Cannot assign delivery"
```

## Frontend Integration

### React Example
```jsx
import { useState } from 'react';

function DeliveryAssignmentForm({ applicationId, onSuccess }) {
  const [formData, setFormData] = useState({
    staffName: '',
    deliveryDate: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/assign-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0] || 'Failed to assign delivery');
      }

      alert('Delivery assigned successfully! Email notification sent to student.');
      onSuccess(data.data.delivery);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Delivery Staff Name"
        value={formData.staffName}
        onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
        required
      />
      <input
        type="date"
        value={formData.deliveryDate}
        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Delivery Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Assigning...' : 'Assign Delivery'}
      </button>
    </form>
  );
}
```

## Security

- ✅ Requires authentication (JWT token)
- ✅ Requires ADMIN role
- ✅ Validates application exists
- ✅ Validates application status
- ✅ Prevents duplicate assignments
- ✅ Audit logs all assignments
- ✅ Email sent asynchronously (non-blocking)

## Performance

- Single database transaction for delivery creation + status update
- Non-blocking email send (doesn't delay response)
- Indexed lookups on `applicationId`
- Average response time: ~100-200ms

## Related Endpoints

- `PUT /api/applications/:id/admin-decision` - Approve application (prerequisite)
- `POST /api/delivery/confirm` - Confirm delivery completion
- `POST /api/delivery/confirm-payment` - Confirm final payment

## Support

For issues or questions:
- Check application logs: `logs/application.log`
- Check audit logs: `SELECT * FROM audit_logs WHERE action = 'DELIVERY_ASSIGNED'`
- Verify email sent: `SELECT * FROM audit_logs WHERE action = 'EMAIL_SENT'`
- Contact: support@fafaaccess.edu.gh
