# Frontend Files Migration Manifest

## Total Files to Move: 96 files

This document lists every file that needs to be moved from the backend repository to the frontend repository.

---

## Main Entry Points (2 files)

```
src/App.tsx
src/main.tsx
```

---

## Components (50 files)

### Root Components (12 files)
```
src/components/AdminPaymentDashboard.jsx
src/components/AdminPaymentDetail.jsx
src/components/AdminSRCInvitations.css
src/components/AdminSRCInvitations.jsx
src/components/AdminUniversityManagement.css
src/components/AdminUniversityManagement.jsx
src/components/PaymentButton.jsx
src/components/PaymentStatus.jsx
src/components/PaymentVerification.jsx
src/components/SRCAgreementAcceptance.css
src/components/SRCAgreementAcceptance.jsx
src/components/UniversitySelector.jsx
src/components/index.ts
```

### Admin Components (11 files)
```
src/components/admin/AdminApprovalQueue.jsx
src/components/admin/AdminDecisionModal.jsx
src/components/admin/AdminStatsCard.jsx
src/components/admin/AuditLogTable.jsx
src/components/admin/AuditLogViewer.jsx
src/components/admin/DeliveredApplicationsHistory.jsx
src/components/admin/DeliveryAssignmentModal.jsx
src/components/admin/DeliveryQueueTable.jsx
src/components/admin/DocumentReviewPanel.jsx
src/components/admin/LaptopFormModal.jsx
src/components/admin/LaptopInventoryTable.jsx
src/components/admin/NotificationLog.jsx
src/components/admin/SRCBottleneckList.jsx
```

### Application Components (2 files)
```
src/components/application/ApplicationActionTimeline.jsx
src/components/application/ApplicationTimeline.jsx
```

### Apply Components (3 files)
```
src/components/apply/ApplyModal.jsx
src/components/apply/ApplyModal.new.jsx
src/components/apply/StepIndicator.jsx
```

### Auth Components (1 file)
```
src/components/auth/ProtectedRoute.jsx
```

### Common Components (3 files)
```
src/components/common/Footer.tsx
src/components/common/GlobalErrorBoundary.tsx
src/components/common/HowItWorks.tsx
```

### Laptop Components (6 files)
```
src/components/laptop/FilterBar.jsx
src/components/laptop/FilterSidebar.tsx
src/components/laptop/LaptopCard.jsx
src/components/laptop/LaptopGrid.jsx
src/components/laptop/PaymentBreakdown.jsx
src/components/laptop/StockBadge.jsx
```

### SRC Components (2 files)
```
src/components/src/SRCApplicationCard.jsx
src/components/src/SRCReviewModal.jsx
```

### Status Components (5 files)
```
src/components/status/ApplicationCard.jsx
src/components/status/ApplicationDetailsModal.jsx
src/components/status/ApplicationEditModal.jsx
src/components/status/ApplicationTimeline.jsx
src/components/status/StatusProgress.jsx
```

### Student Components (3 files)
```
src/components/student/ChangeLaptopModal.jsx
src/components/student/PaymentDeliveryStatus.jsx
src/components/student/PaymentModal.jsx
```

---

## Pages (30 files)

```
src/pages/AdminAnalyticsDashboard.tsx
src/pages/AdminAuditLogViewer.jsx
src/pages/AdminAuditLogViewer.tsx
src/pages/AdminDashboard.jsx
src/pages/AdminProductManagement.jsx
src/pages/ApplicationDetailPage.jsx
src/pages/DeliveryPerformancePanel.tsx
src/pages/DeliveryQueue.jsx
src/pages/EmailVerificationPage.jsx
src/pages/ExportModal.tsx
src/pages/FinancialAnalyticsPanel.tsx
src/pages/ForgotPasswordPage.jsx
src/pages/HomePage.tsx
src/pages/LaptopCatalog.jsx
src/pages/LaptopDetails.jsx
src/pages/LaptopInventoryPage.jsx
src/pages/LoginPage.jsx
src/pages/NotFoundPage.jsx
src/pages/NotificationPreferences.jsx
src/pages/RegisterPage.jsx
src/pages/ResetPasswordPage.jsx
src/pages/SRCDashboard.jsx
src/pages/SrcAccountabilityPanel.tsx
src/pages/StudentDashboard.jsx
src/pages/StudentProfile.jsx
src/pages/StudentSecuritySettings.jsx
src/pages/StudentSettings.jsx
src/pages/SupportTickets.jsx
src/pages/UnauthorizedPage.jsx
src/pages/UniversityPerformancePanel.tsx
```

---

## Layouts (1 file)

```
src/layouts/Layout.tsx
```

---

## Hooks (3 files)

```
src/hooks/index.ts
src/hooks/useAuth.js
src/hooks/usePayment.js
```

---

## Contexts (1 file)

```
src/contexts/AuthContext.jsx
```

---

## Assets (1 file)

```
src/assets/.gitkeep
```

Note: There may be additional image/icon files in this directory that need to be moved.

---

## Styles (9 files)

```
src/styles/admin-analytics.css
src/styles/audit-log.css
src/styles/delivery-analytics.css
src/styles/design-system.css
src/styles/export-modal.css
src/styles/financial-analytics.css
src/styles/index.css
src/styles/src-accountability.css
src/styles/university-analytics.css
```

---

## Documentation Files (2 files)

```
FRONTEND_AUTH_COMPLETE.md
STUDENT_PAYMENT_FLOW_FRONTEND.md
```

---

## Migration Command

To copy all these files from the backend repo to the frontend repo:

```bash
#!/bin/bash

# Set source and destination directories
BACKEND_DIR="/path/to/Fafa-Access"
FRONTEND_DIR="/path/to/fafa-access-frontend"

cd "$BACKEND_DIR"

# Copy main entry points
cp src/App.tsx "$FRONTEND_DIR/src/"
cp src/main.tsx "$FRONTEND_DIR/src/"

# Copy directories
cp -r src/components "$FRONTEND_DIR/src/"
cp -r src/pages "$FRONTEND_DIR/src/"
cp -r src/layouts "$FRONTEND_DIR/src/"
cp -r src/hooks "$FRONTEND_DIR/src/"
cp -r src/contexts "$FRONTEND_DIR/src/"
cp -r src/assets "$FRONTEND_DIR/src/"
cp -r src/styles "$FRONTEND_DIR/src/"

# Copy documentation
cp FRONTEND_AUTH_COMPLETE.md "$FRONTEND_DIR/"
cp STUDENT_PAYMENT_FLOW_FRONTEND.md "$FRONTEND_DIR/"

echo "✅ Frontend files copied successfully!"
echo "Total directories copied: 8"
echo "Total files copied: ~96"
```

---

## After Migration

Once files are copied to the frontend repo, these files should be **removed** from the backend repo to maintain clean separation.

---

**Generated**: February 18, 2026  
**Backend Repo**: Gordon28533/Fafa-Access  
**Target Frontend Repo**: fafa-access-frontend (new)
