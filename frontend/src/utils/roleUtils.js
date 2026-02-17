// Role-based feature authorization checks

export const ROLES = {
  STUDENT: 'STUDENT',
  SRC: 'SRC',
  ADMIN: 'ADMIN',
  DELIVERY: 'DELIVERY'
}

export const canSubmitApplication = (role) => role === ROLES.STUDENT

export const canReviewApplication = (role) => role === ROLES.SRC

export const canApproveApplication = (role) => role === ROLES.ADMIN

export const canAssignDelivery = (role) => role === ROLES.ADMIN

export const canConfirmDelivery = (role) => role === ROLES.DELIVERY

export const canCollectPayment = (role) => role === ROLES.DELIVERY || role === ROLES.ADMIN

// Feature visibility by role
export const getFeaturesByRole = (role) => {
  const features = {
    [ROLES.STUDENT]: [
      'view_own_applications',
      'submit_application',
      'edit_application',
      'withdraw_application',
      'view_application_status',
      'make_30_percent_payment'
    ],
    [ROLES.SRC]: [
      'view_pending_applications',
      'review_application_documents',
      'approve_application',
      'reject_application',
      'view_application_details'
    ],
    [ROLES.ADMIN]: [
      'view_all_applications',
      'approve_application',
      'reject_application',
      'assign_delivery',
      'view_audit_logs',
      'manage_delivery_staff',
      'view_payment_status'
    ],
    [ROLES.DELIVERY]: [
      'view_assigned_deliveries',
      'confirm_delivery',
      'collect_70_percent_payment',
      'generate_receipt'
    ]
  }
  return features[role] || []
}

export const hasFeature = (userRole, feature) => {
  return getFeaturesByRole(userRole).includes(feature)
}
