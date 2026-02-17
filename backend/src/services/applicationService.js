// Mock application data service
// This service provides hardcoded application data for the student dashboard

// NOTE: This service is currently using mock data. When the real API is wired, keep the
// editable/withdrawable guards so students cannot change applications once SRC review starts.
const mockApplications = [
  {
    id: 'app-1',
    reference: 'APP-10294',
    submittedAt: '2024-01-15',
    status: 'PENDING_SRC',
    student: {
      fullName: 'Kwame Asante',
      university: 'University of Ghana',
      level: '200',
      course: 'Computer Science',
      phoneNumber: '+233 24 123 4567',
      address: '123 Main Street, Accra',
      ghanaCardNumber: 'GHA-123456789-0'
    },
    laptop: { id: 1, brand: 'Dell', model: 'XPS 13' },
    identity: { method: 'student_id', studentId: 'UG/CS/2022/001' },
    documents: {
      ghanaCardFront: 'ghana_card_front.jpg',
      ghanaCardBack: 'ghana_card_back.jpg',
      selfieWithCard: 'selfie_with_card.jpg'
    },
    pricing: {
      totalPrice: 1099.99,
      initial70: 769.99,
      final30: 329.99
    },
    delivery: { delivered: false, payment70Collected: false, receiptRef: null, staffName: null, deliveryDate: null, location: null },
    payments: {
      initial70: { type: 'INITIAL_70', status: 'PENDING', amount: 769.99 },
      final30: { type: 'FINAL_30', status: 'PENDING', amount: 329.99, dueDate: null }
    }
  },
  {
    id: 'app-2',
    reference: 'APP-10287',
    submittedAt: '2024-01-10',
    status: 'SRC_APPROVED',
    student: {
      fullName: 'Ama Mensah',
      university: 'Kwame Nkrumah University of Science and Technology',
      level: '300',
      course: 'Information Technology',
      phoneNumber: '+233 20 987 6543',
      address: '456 University Road, Kumasi',
      ghanaCardNumber: 'GHA-987654321-1'
    },
    laptop: { id: 4, brand: 'Apple', model: 'MacBook Air M2' },
    identity: { method: 'admission_letter', admissionLetter: 'admission_letter.pdf' },
    documents: {
      ghanaCardFront: 'ghana_card_front.jpg',
      ghanaCardBack: 'ghana_card_back.jpg',
      selfieWithCard: 'selfie_with_card.jpg'
    },
    pricing: {
      totalPrice: 1049.99,
      initial70: 734.99,
      final30: 314.99
    },
    delivery: { delivered: false, payment70Collected: false, receiptRef: null, staffName: null, deliveryDate: null, location: null },
    payments: {
      initial70: { type: 'INITIAL_70', status: 'PENDING', amount: 734.99 },
      final30: { type: 'FINAL_30', status: 'PENDING', amount: 314.99, dueDate: null }
    }
  },
  {
    id: 'app-3',
    reference: 'APP-10265',
    submittedAt: '2024-01-05',
    status: 'ADMIN_APPROVED',
    student: {
      fullName: 'Kofi Boateng',
      university: 'University of Cape Coast',
      level: '100',
      course: 'Business Administration',
      phoneNumber: '+233 26 555 1234',
      address: '789 Campus Avenue, Cape Coast',
      ghanaCardNumber: 'GHA-555666777-2'
    },
    laptop: { id: 7, brand: 'Acer', model: 'Swift 3' },
    identity: { method: 'student_id', studentId: 'UCC/BA/2023/045' },
    documents: {
      ghanaCardFront: 'ghana_card_front.jpg',
      ghanaCardBack: 'ghana_card_back.jpg',
      selfieWithCard: 'selfie_with_card.jpg'
    },
    pricing: {
      totalPrice: 599.99,
      initial70: 419.99,
      final30: 179.99
    },
    delivery: { delivered: false, payment70Collected: false, receiptRef: null, staffName: null, deliveryDate: null, location: null },
    payments: {
      initial70: { type: 'INITIAL_70', status: 'PENDING', amount: 419.99 },
      final30: { type: 'FINAL_30', status: 'PENDING', amount: 179.99, dueDate: null }
    }
  },
  {
    id: 'app-4',
    reference: 'APP-10240',
    submittedAt: '2023-12-28',
    status: 'SRC_REJECTED',
    student: {
      fullName: 'Efua Adjei',
      university: 'Ashesi University',
      level: '400',
      course: 'Engineering',
      phoneNumber: '+233 54 111 2222',
      address: '321 Hilltop Road, Berekuso',
      ghanaCardNumber: 'GHA-111222333-3'
    },
    laptop: { id: 2, brand: 'HP', model: 'Spectre x360' },
    identity: { method: 'student_id', studentId: 'ASH/ENG/2020/012' },
    documents: {
      ghanaCardFront: 'ghana_card_front.jpg',
      ghanaCardBack: 'ghana_card_back.jpg',
      selfieWithCard: 'selfie_with_card.jpg'
    },
    pricing: {
      totalPrice: 849.99,
      initial70: 594.99,
      final30: 254.99
    },
    delivery: { delivered: false, payment70Collected: false, receiptRef: null, staffName: null, deliveryDate: null, location: null },
    payments: {
      initial70: { type: 'INITIAL_70', status: 'PENDING', amount: 594.99 },
      final30: { type: 'FINAL_30', status: 'PENDING', amount: 254.99, dueDate: null }
    },
    rejectionReason: 'Incomplete documentation'
  }
]

/**
 * Application status constants
 */
export const APPLICATION_STATUS = {
  PENDING_SRC: 'PENDING_SRC',
  SRC_APPROVED: 'SRC_APPROVED',
  ADMIN_APPROVED: 'ADMIN_APPROVED',
  SRC_REJECTED: 'SRC_REJECTED',
  ADMIN_REJECTED: 'ADMIN_REJECTED',
  DELIVERY_ASSIGNED: 'DELIVERY_ASSIGNED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  WITHDRAWN: 'WITHDRAWN'
}

/**
 * Gets all applications for a student
 * @returns {Promise<Array>} Array of application objects
 */
export const getStudentApplications = async () => {
  try {
    const response = await fetch('/api/applications/my', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.status}`)
    }

    const data = await response.json()
    
    // Backend returns: { success: true, data: { applications: [...], total: N } }
    let applications = []
    if (data.success && data.data && data.data.applications) {
      applications = data.data.applications
    } else if (Array.isArray(data)) {
      applications = data
    }
    
    // Return applications, mapping fields as needed
    return applications.map(app => ({
      id: app.id,
      reference: app.reference || app.id,
      submittedAt: app.createdAt || app.submittedAt,
      status: app.status,
      student: app.student || {},
      laptop: app.laptop,
      identity: app.identity,
      documents: app.documents,
      pricing: app.pricing,
      delivery: app.delivery,
      payments: app.payments
    }))
  } catch (err) {
    console.error('Error fetching student applications:', err)
    // Fall back to mock data in case of error
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockApplications)
      }, 300)
    })
  }
}

const ensureEditable = (application) => {
  if (!application) {
    throw new Error('Application not found')
  }

  if (application.status !== APPLICATION_STATUS.PENDING_SRC) {
    throw new Error('Application can only be edited or withdrawn before SRC review starts')
  }
}

const applyEditableFieldUpdates = (application, updates) => ({
  ...application,
  student: {
    ...application.student,
    fullName: updates.fullName ?? application.student.fullName,
    university: updates.university ?? application.student.university,
    level: updates.level ?? application.student.level,
    course: updates.course ?? application.student.course,
    phoneNumber: updates.phoneNumber ?? application.student.phoneNumber,
    address: updates.address ?? application.student.address
  }
})

export const updateApplication = async (id, updates) => {
  try {
    const response = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`Failed to update application: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.application || data.application || data
  } catch (err) {
    console.error('Error updating application:', err)
    // Fall back to mock data
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const index = mockApplications.findIndex((app) => app.id === id)
          const application = mockApplications[index]
          ensureEditable(application)

          const updated = applyEditableFieldUpdates(application, updates)
          mockApplications[index] = updated
          resolve(updated)
        } catch (error) {
          reject(error)
        }
      }, 200)
    })
  }
}

export const withdrawApplication = async (id, reason = 'Withdrawn by student') => {
  try {
    const response = await fetch(`/api/applications/${id}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ reason })
    })

    if (!response.ok) {
      throw new Error(`Failed to withdraw application: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.application || data.application || data
  } catch (err) {
    console.error('Error withdrawing application:', err)
    // Fall back to mock data
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const index = mockApplications.findIndex((app) => app.id === id)
          const application = mockApplications[index]
          ensureEditable(application)

          const withdrawn = {
            ...application,
            status: APPLICATION_STATUS.WITHDRAWN,
            withdrawalReason: reason,
            submittedAt: application.submittedAt
          }

          mockApplications[index] = withdrawn
          resolve(withdrawn)
        } catch (error) {
          reject(error)
        }
      }, 200)
    })
  }
}

/**
 * Gets applications pending SRC review
 * @param {string} university - Optional university filter
 * @returns {Promise<Array>} Array of application objects with pending_src status
 */
export const getSRCPendingApplications = async (university = null) => {
  try {
    // Call the actual API endpoint
    const response = await fetch('/api/applications/src/pending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Include cookies for authentication
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.status}`)
    }

    const data = await response.json()
    
    // Backend returns: { success: true, data: { applications: [...], total: N } }
    // where each item has structure: { application: {...}, student: {...}, user: {...} }
    let applications = []
    if (data.success && data.data && data.data.applications) {
      applications = data.data.applications
    } else if (Array.isArray(data)) {
      applications = data
    }
    
    // Flatten the nested structure from backend and map to frontend format
    return applications.map(item => {
      const appData = item.application || item
      const studentData = item.student || {}
      const userData = item.user || {}
      
      return {
        id: appData.id,
        reference: appData.reference || appData.id,
        submittedAt: appData.createdAt || appData.submittedAt,
        status: appData.status,
        student: {
          fullName: userData.fullName || studentData.fullName,
          university: studentData.universityName || studentData.university,
          level: studentData.level,
          course: studentData.course,
          phoneNumber: userData.phoneNumber || studentData.phoneNumber,
          address: studentData.address,
          ghanaCardNumber: studentData.ghanaCardNumber
        },
        laptop: appData.laptop,
        identity: appData.identity,
        documents: appData.documents,
        pricing: appData.pricing,
        delivery: appData.delivery,
        payments: appData.payments
      }
    })
  } catch (err) {
    console.error('Error fetching SRC pending applications:', err)
    // Fall back to mock data in case of error
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = mockApplications.filter(
          app => app.status === APPLICATION_STATUS.PENDING_SRC
        )
        
        if (university) {
          filtered = filtered.filter(app => app.student?.university === university)
        }
        
        resolve(filtered)
      }, 300)
    })
  }
}

/**
 * Gets a single application by ID
 * @param {number} id - Application ID
 * @returns {Promise<Object|null>} Application object or null
 */
export const getApplicationById = async (id) => {
  try {
    const response = await fetch(`/api/applications/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch application: ${response.status}`)
    }

    const data = await response.json()
    
    // Backend returns: { success: true, data: { application: {...} } } or just the application object
    const app = data.data?.application || data.application || data
    
    return {
      id: app.id,
      reference: app.reference || app.id,
      submittedAt: app.createdAt || app.submittedAt,
      status: app.status,
      student: app.student || {},
      laptop: app.laptop,
      identity: app.identity,
      documents: app.documents,
      pricing: app.pricing,
      delivery: app.delivery,
      payments: app.payments
    }
  } catch (err) {
    console.error('Error fetching application:', err)
    // Fall back to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const application = mockApplications.find(app => app.id === id)
        resolve(application || null)
      }, 100)
    })
  }
}
