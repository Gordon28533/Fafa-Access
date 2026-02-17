# SRC Onboarding - Quick Reference

**For Administrators**

---

## 🚀 Quick Start (5 Minutes)

### 1. Access Admin Dashboard
1. Log in with admin credentials
2. Click **"SRC Invitations"** in left sidebar
3. Dashboard shows statistics and invitations list

### 2. Create an Invitation
1. Click **"Create Invitation"** button
2. Fill form:
   - **University:** Select from dropdown
   - **First Name:** SRC officer's first name
   - **Last Name:** SRC officer's last name
   - **Email:** Must be unique email address
   - **Phone:** Optional contact number
3. Click **"Send Invitation"**
4. ✅ Email sent automatically with secure link!

### 3. Track Invitation Status
View invitations table with columns:
- **Name:** Full name of invited SRC
- **Email:** Contact email
- **University:** Associated university
- **Status:** Active or Expired
- **Agreement:** Pending, Accepted (with date)
- **Account:** Pending or Created
- **Expires:** Expiry date (7 days)
- **Actions:** Resend or Cancel buttons

### 4. Resend Invitation (if needed)
1. Click **"Resend"** button on invitation row
2. Confirm action
3. ✅ New token generated, new expiry set (7 days)
4. ✅ New email sent automatically

### 5. Cancel Invitation (if needed)
1. Click **"Cancel"** button on invitation row
2. Confirm action
3. ✅ Invitation marked as expired
4. ⚠️ SRC can no longer accept agreement

---

## 📊 Dashboard Overview

### Statistics Cards
- **Total:** All invitations ever sent
- **Pending Acceptance:** Awaiting SRC agreement acceptance
- **Agreement Accepted:** SRC has accepted terms
- **Accounts Created:** Full onboarding complete
- **Expired:** Tokens that have expired (7-day limit)

### Search & Filter
- **Search Bar:** Search by name, email, or university
- **Status Filter:** 
  - All invitations
  - Pending acceptance
  - Agreement accepted

---

## 📧 What Happens After You Create an Invitation?

### 1. System Actions (Automatic)
- ✅ Generate 64-character secure token
- ✅ Set 7-day expiry
- ✅ Send professional HTML email to SRC
- ✅ Display invitation in dashboard

### 2. SRC Receives Email
Email includes:
- Personalized greeting with their name
- University they're associated with
- Overview of partnership agreement
- **Big green button:** "Accept Agreement"
- Secure link (unique, one-time use)
- 7-day expiry warning
- Contact information

### 3. SRC Clicks Link
Browser opens: `/src/accept/{token}`

SRC sees:
- Their invitation details (name, university, expiry)
- Full partnership agreement (7 sections)
- Checkbox: "I have read and agree..."
- "Accept Agreement" button

### 4. SRC Accepts Agreement
After clicking "Accept Agreement":
- ✅ Database updated: `agreement_accepted = true`
- ✅ Timestamp recorded: `agreement_accepted_at = NOW()`
- ✅ Success screen shown
- ✅ "Admin will contact you within 24 hours" message
- ✅ Auto-redirect to home after 3 seconds

### 5. You See Status Update
In your dashboard:
- **Agreement column:** Changes to "Accepted ✓" with date
- **Green badge** indicates acceptance
- Invitation ready for account creation (next step)

---

## 🔐 Security Features

### Why is this secure?

1. **No Public Signup** 
   - SRC accounts ONLY via admin invitation
   - No public registration form exists

2. **Secure Tokens**
   - 64-character cryptographic random string
   - Impossible to guess or brute-force

3. **Time-Limited**
   - 7-day expiry (hard deadline)
   - Expired tokens cannot be used
   - Resend generates new token with new expiry

4. **One-Time Use**
   - Token marked as used after acceptance
   - Cannot accept twice
   - Prevents replay attacks

5. **Email-Based**
   - Link sent only via email
   - Not displayed in your admin UI
   - Secure delivery via email service

6. **Audit Trail**
   - You can see who invited (your name)
   - When agreement was accepted
   - When account was created

---

## ⚙️ Common Actions

### Create Multiple Invitations
1. Click "Create Invitation"
2. Fill form
3. Click "Send Invitation"
4. **Repeat** - modal stays open for multiple entries
5. Close modal when done

### Resend Expired Invitation
1. Find invitation with "Expired" status
2. Click "Resend"
3. ✅ New token generated
4. ✅ New 7-day expiry
5. ✅ New email sent

### Cancel Pending Invitation
1. Find invitation with "Pending" agreement
2. Click "Cancel"
3. Confirm action
4. ✅ Marked as expired
5. ⚠️ SRC can no longer accept

### Check Statistics
Just open the dashboard - statistics update automatically:
- Total invitations sent
- How many are waiting for acceptance
- How many have accepted
- How many accounts created
- How many expired

---

## 🔍 FAQ

### Q: How long does the invitation last?
**A:** 7 days from creation. After that, it expires and you need to resend.

### Q: Can I extend an invitation expiry?
**A:** No, but you can **resend** the invitation, which generates a new token with a fresh 7-day expiry.

### Q: What if SRC never receives the email?
**A:** Click **"Resend"** to send a new invitation email with a new token.

### Q: Can I send multiple invitations to the same email?
**A:** No, email addresses must be unique. If you need to send again, cancel the first invitation and create a new one.

### Q: How do I know when SRC accepts the agreement?
**A:** The dashboard updates automatically. The "Agreement" column will show "Accepted ✓" with the date and time.

### Q: Can SRC accept the agreement after it expires?
**A:** No. Expired tokens are rejected. You must resend for them to accept.

### Q: What happens after SRC accepts the agreement?
**A:** You'll see the status update in your dashboard. The next step is creating their account (separate workflow).

### Q: Can I cancel an invitation after SRC accepts?
**A:** You can cancel, but it won't undo the acceptance. If an account has been created, do not cancel.

### Q: How do I see all expired invitations?
**A:** Use the **Status Filter** dropdown and select "All invitations", then sort by expiry date.

### Q: What's in the partnership agreement?
**A:** 7 sections covering:
1. Rights & Responsibilities
2. Data Confidentiality & Protection
3. Account Security & Access
4. Acceptable Use Policy
5. Professional Conduct Standards
6. Termination & Offboarding
7. Support & Escalation

---

## 📝 Best Practices

### ✅ Do:
- Create invitations as soon as you have SRC officer details
- Use official university email addresses
- Resend if SRC doesn't respond within 5 days
- Check dashboard daily for new acceptances
- Cancel invitations if SRC declines or is no longer needed

### ❌ Don't:
- Share the invite link publicly (it's unique and personal)
- Create duplicate invitations for the same email
- Cancel invitations after accounts are created
- Ignore expired invitations (resend or cancel them)

---

## 🆘 Troubleshooting

### "Email not received"
1. Check spam/junk folder
2. Verify email address is correct
3. Click "Resend" to send again
4. Contact IT support if still not received

### "Token expired" error for SRC
1. Check expiry date in dashboard
2. If expired, click "Resend"
3. SRC will receive new link

### "Cannot create invitation" error
1. Check all required fields are filled
2. Ensure email is unique (not already invited)
3. Verify university is selected
4. Refresh page and try again

### SRC reports "Agreement already accepted"
1. Check dashboard - agreement may already be accepted
2. If yes, proceed to account creation
3. If no, contact technical support

---

## 📊 Action Summary

| Action | Button | Result |
|--------|--------|--------|
| Create | "Create Invitation" | Email sent, 7-day timer starts |
| Resend | "Resend" on row | New token, new expiry, new email |
| Cancel | "Cancel" on row | Marks expired, blocks acceptance |
| Search | Search bar | Filter by name/email/university |
| Filter | Status dropdown | Show all/pending/accepted |

---

## 🔗 Admin Routes

- **Admin Dashboard:** `/admin`
- **SRC Invitations:** `/admin/src-invitations`
- **Navigation:** Left sidebar → "SRC Invitations"

---

## 📞 Support

Need help?
- **Email:** admin-support@fafaaccess.com
- **Documentation:** Full setup guide available
- **Logs:** Check system logs for detailed errors

---

**Last Updated:** February 8, 2026  
**Status:** Production Ready ✅
