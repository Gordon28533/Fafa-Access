export type UserRole = 'STUDENT' | 'SRC' | 'ADMIN' | 'DELIVERY';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  universityId?: string;
  status?: 'PENDING_EMAIL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

export type ApplicationStatus =
  | 'PENDING_SRC'
  | 'SRC_APPROVED'
  | 'SRC_REJECTED'
  | 'ADMIN_APPROVED'
  | 'ADMIN_REJECTED'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'WITHDRAWN';

export interface StudentInfo {
  fullName: string;
  university: string;
  level: string;
  course: string;
  phoneNumber: string;
  address: string;
  ghanaCardNumber: string;
}

export interface Delivery {
  staffName?: string | null;
  deliveryDate?: string | null;
  location?: string | null;
  delivered: boolean;
  payment70Collected: boolean;
  receiptRef?: string | null;
}

export type PaymentStatus = 'PENDING' | 'COLLECTED';

export interface Payment {
  type: 'INITIAL_70' | 'FINAL_30';
  status: PaymentStatus;
  amount: number;
  collectedBy?: string | null;
  collectedAt?: string | null;
  dueDate?: string | null; // for FINAL_30
  reference?: string | null;
}

export interface Application {
  id: string;
  reference: string;
  status: ApplicationStatus;
  submittedAt: string;
  student: StudentInfo;
  laptop: {
    id?: string | number;
    brand: string;
    model: string;
  };
  identity: {
    method: 'student_id' | 'admission_letter';
    studentId?: string | null;
    admissionLetter?: string | null;
  };
  documents: {
    ghanaCardFront: string;
    ghanaCardBack: string;
    selfieWithCard: string;
  };
  pricing: {
    totalPrice: number;
    initial70: number;
    final30: number;
  };
  delivery: Delivery;
  payments: {
    initial70: Payment;
    final30: Payment;
  };
  rejectionReason?: string;
}
