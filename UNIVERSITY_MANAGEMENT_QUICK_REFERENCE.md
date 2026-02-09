---
title: University Management - Admin Quick Reference
created: February 8, 2024
status: Complete
---

# 🏫 University Management - Admin Quick Reference

## Accessing the System

**URL**: `http://localhost:3000/admin/universities` (or your production domain)
**Requirements**: Must be logged in as ADMIN user

---

## Managing Universities - Step by Step

### ✅ Add a New University

1. Click **"Add University"** button (top right)
2. Fill in the form:
   - **University Name**: Full official name (e.g., "University of Lagos")
   - **Code**: Unique abbreviation (e.g., "UNILAG") - for quick reference
   - **Email**: Official contact email (e.g., "info@unilag.edu.ng")
   - **Phone**: Contact phone (e.g., "234-1-222-2222")
   - **Address**: Physical location (optional but recommended)
   - **Active**: Check box to enable applications immediately
3. Click **"Create University"**
4. Success message appears - university is now in system

**Tips**:
- Code should be UPPERCASE and without spaces
- Email and code must be unique (system prevents duplicates)
- Active universities appear in student forms immediately

---

### 📋 View All Universities

The main dashboard shows:
- **Statistics Cards**:
  - Total: All universities in system
  - Active: Taking applications right now
  - Inactive: Not accepting applications
  - % Active: Percentage accepting applications

- **University Table**:
  - Name, Code, Email, Phone, Address
  - Status (checkmark = active, circle = inactive)
  - Action buttons for each university

**Search & Filter**:
- **Search Box**: Find by university name or code
- **Status Filter**: Show All / Active Only / Inactive Only

---

### ✏️ Edit a University

1. Find university in table
2. Click **"Edit"** button (pencil icon)
3. Modal opens with form pre-filled
4. Change any field you need
5. Click **"Save Changes"**
6. Page updates automatically

**What you can edit**:
- Name, Code, Email, Phone, Address
- (Active/Inactive status uses separate buttons)

---

### ✅ Activate a University (Allow Applications)

**Method 1: Toggle Button**
1. Find university in table
2. Click **toggle switch** (right side)
3. Switch turns green = ACTIVE
4. Students can now select this university

**Method 2: From Edit Modal**
1. Click "Edit" on university
2. Check "Active" box
3. Click "Save Changes"

**What happens when activated**:
- ✅ Appears in student's university selector
- ✅ Students can create applications for it
- ✅ Shows in "List Available Universities" endpoint

---

### ⭕ Deactivate a University (Block Applications)

**Method 1: Toggle Button**
1. Find university in table
2. Click **toggle switch** (right side)
3. Switch turns gray = INACTIVE
4. Students can NO LONGER select this university

**Method 2: From Edit Modal**
1. Click "Edit" on university
2. Uncheck "Active" box
3. Click "Save Changes"

**What happens when deactivated**:
- ❌ Disappears from student's university selector
- ❌ Students cannot create applications for it
- ❌ Shows 410 error if accessed directly
- ℹ️ Historical applications remain unchanged

**When to deactivate**:
- University is closing/restructuring
- Temporarily not accepting applications
- Testing the system
- Maintenance period

---

### 🗑️ Delete a University

1. Find university in table
2. Click **"Delete"** button (trash icon)
3. **Confirmation dialog** appears: "Are you sure?"
4. Click **"Confirm"** to permanently delete

⚠️ **Warning**: Deletion is PERMANENT and cannot be undone

**When to delete**:
- Duplicate entry (create better code/email first)
- Test/fake university (created by mistake)
- Very old historical data (archive first)

---

## Statistics Dashboard

### What the Numbers Mean

```
Total Universities: 5
- Total count of all universities in system

Active Universities: 4
- Currently accepting applications
- Students can select these

Inactive Universities: 1
- NOT accepting applications
- Hidden from students
- Can be reactivated anytime

Active Percentage: 80%
- How many are actively accepting
- Green = healthy (>50%), Red = low (<50%)
```

### Using Statistics

**When Total ≠ Active**:
- Some universities are deactivated
- This is normal and fine
- Reactivate when ready

**When % Active is low (e.g., 20%)**:
- Most universities not accepting
- Students have limited choices
- Consider reactivating some

---

## Common Tasks

### Task 1: Prepare System for New School Year
```
1. Activate all universities that should accept applications
2. Check if any new universities need adding
3. Verify statistics show healthy % Active (aim for 80%+)
```

### Task 2: Maintenance Window
```
1. Deactivate all universities temporarily
2. Do maintenance work
3. Reactivate universities to resume
```

### Task 3: Add New University
```
1. Contact university for: Name, Code, Email, Phone, Address
2. Click "Add University"
3. Fill all fields correctly
4. Check "Active" if should accept applications now
5. Click "Create"
```

### Task 4: University Stops Accepting Applications
```
1. Find the university in table
2. Click toggle switch to deactivate
3. Students can no longer apply
4. University can still see existing applications
```

### Task 5: Restore Deactivated University
```
1. Filter to show "Inactive Only"
2. Find the university
3. Click toggle switch to reactivate
4. Students can now apply again
```

### Task 6: Find University by Code
```
1. Click search box
2. Type code (e.g., "UNILAG")
3. Table filters automatically
4. Edit/activate/deactivate as needed
```

---

## Field Explanations

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Name | Yes | Text 1-255 chars | University of Lagos |
| Code | Yes | Uppercase, unique | UNILAG |
| Email | Yes | Valid email, unique | info@unilag.edu.ng |
| Phone | Yes | 7+ characters | 234-1-222-2222 |
| Address | No | Text (optional) | 123 Akoka Road, Lagos |
| Active | No | Checkbox | ☑ Checked = Active |

---

## Error Messages & Solutions

### ❌ "University with this code already exists"
**Solution**: Use a different code that's not already in the system

### ❌ "University with this email already exists"
**Solution**: Use a different email address that's not already in the system

### ❌ "Invalid email format"
**Solution**: Make sure email has @ symbol and domain (e.g., user@domain.com)

### ❌ "Phone number too short"
**Solution**: Enter at least 7 characters for phone number

### ❌ "University name is required"
**Solution**: Fill in the University Name field

### ❌ "Failed to create university"
**Solution**: 
1. Check all fields are filled correctly
2. Try again - might be temporary server issue
3. Contact admin if persists

### ❌ "University not found"
**Solution**: University may have been deleted. Refresh page.

---

## Dashboard Features

### 🔍 Search
- Type in search box
- Matches university name or code
- Case-insensitive (UNILAG = unilag)
- Real-time filtering

### 🏷️ Filter by Status
- **All**: Show all universities
- **Active Only**: Show only taking applications
- **Inactive Only**: Show only blocked from applications

### 📊 Sort/Pagination
- Click column headers to sort
- View configurable items per page
- Next/Previous buttons for pages

### 📱 Mobile Friendly
- Responsive design works on tablets
- Touch-friendly buttons
- Optimized table view

---

## Important Rules to Remember

### ✅ DO
- ✅ Add new universities with unique codes
- ✅ Activate/deactivate to control application flow
- ✅ Review statistics regularly
- ✅ Search before adding (avoid duplicates)
- ✅ Keep contact information up-to-date

### ❌ DON'T
- ❌ Create duplicate university codes
- ❌ Share admin access with non-admins
- ❌ Delete active universities used by students
- ❌ Leave all universities inactive (students can't apply)

---

## Student Experience

### What Students See

When students create an application, they see:

```
Select University *             [Dropdown ▼]
  Choose a university...
  
  [Search box]
  
  📍 Covenant University (COVENANTUNIV)
     Ota, Ogun State
     
  📍 University of Lagos (UNILAG)
     Akoka Road, Lagos
     
  📍 University of Ibadan (UI)
     Ibadan, Oyo State
```

### What Students DON'T See

- ❌ Inactive universities (not in dropdown)
- ❌ University email and phone (private)
- ❌ Active/inactive status
- ❌ Statistics
- ❌ Admin controls

---

## API Commands (For Developers)

### Get List of Universities (Admin)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/universities
```

### Get Statistics
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/universities/stats
```

### Get Universities (Student View - Active Only)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/universities
```

---

## Quick Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search box | Ctrl+F or Cmd+F |
| Add university modal | (Click button - no shortcut) |
| Close modal | Esc |
| Submit form | Enter (after filling) |

---

## Troubleshooting

### I can't access the admin dashboard
- [ ] Are you logged in? (Check top-right for username)
- [ ] Are you an admin? (Contact super-admin if not)
- [ ] Try refreshing page (Ctrl+R)
- [ ] Check URL: `/admin/universities`

### Universities not appearing in student form
- [ ] Are they active? (Check Status column, should show ✓)
- [ ] Are they in database? (Check Statistics total > 0)
- [ ] Try refreshing page to reload
- [ ] Check if student is logged in

### Can't edit university
- [ ] Click "Edit" button (pencil icon)
- [ ] Make changes in the form
- [ ] Click "Save Changes"
- [ ] If stuck, refresh and try again

### Delete button not working
- [ ] Check you have admin permissions
- [ ] Confirmation dialog should appear
- [ ] Click "Confirm" to proceed
- [ ] If still stuck, contact admin

---

## Support

**For Issues**:
1. Check this Quick Reference first
2. Try refreshing the page
3. Clear browser cache (Ctrl+Shift+Delete)
4. Contact admin or support team
5. Check system logs for error details

---

## Summary

**You can now:**
- ✅ Add universities that students can apply to
- ✅ Activate/deactivate universities to control flow
- ✅ Search and manage thousands of universities
- ✅ Monitor application eligibility
- ✅ View system statistics

**Key Point**: The system automatically prevents students from selecting deactivated universities. Everything works in real-time!

🎉 **You're all set to manage universities!**
