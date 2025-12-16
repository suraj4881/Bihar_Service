export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'; // Added role field
  language?: string; // English, Hindi
  address: string;
  city: string;
  state: string;
  pincode: string;
  profilePhoto?: string;
  isActive: boolean;      // Account enabled/disabled
  isVerified: boolean;    // Email verified
  isOnline: boolean;      // Currently logged in (NEW)
  lastSeen?: string;      // Last activity timestamp (NEW)
  rating: number;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  skill: string;
  city: string;
  address: string;
  price: number;
  description: string;
  profilePhoto?: string;
  servicePhotos?: string[];
  experience: string;
  workingHours: string;
  serviceAreas: string[];
  isActive: boolean;      // Account enabled/disabled
  isVerified: boolean;    // Email/KYC verified
  isOnline: boolean;      // Currently logged in (NEW)
  lastSeen?: string;      // Last activity timestamp (NEW)
  rating: number;
  totalBookings: number;
  completedBookings: number;
  languages: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'KYC' | 'REVIEW' | 'PROMOTION' | 'SYSTEM';
  referenceId?: string;
  icon?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  service: string;
  address: string;
  city: string;
  pincode: string;
  scheduledDate: string;
  price: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  specialInstructions?: string;
  customerRating?: number;
  customerFeedback?: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  isActive: boolean;
  subcategories: string[];
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: 'AADHAR' | 'PAN' | 'VOTER' | 'DRIVER_LICENSE';
  documentNumber: string;
  documentFrontImage: string;
  documentBackImage?: string;
  selfieImage: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  fullName: string;
  dateOfBirth: string;
  address: string;
  uploadedAt: string;
}

export interface KYCStatus {
  id: string;
  userId: string;
  overallStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PARTIAL';
  documentsUploaded: number;
  documentsVerified: number;
  documentsRequired: number;
  uploadedDocuments: string[];
  verifiedDocuments: string[];
  selfieUploaded: boolean;
  selfieVerified: boolean;
  kycLevel: 'BRONZE' | 'SILVER' | 'GOLD';
  verificationScore: number;
  createdAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  locationType?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
