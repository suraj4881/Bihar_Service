export interface Service {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  icon: string;
  image?: string;
  basePrice: number;
  priceUnit: string;
  duration: string;
  tags: string[];
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  isPopular: boolean;
  isCustom: boolean;
  sortOrder: number;
  bookingCount: number;
  averageRating: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  toolsRequired?: string;
  skillsRequired?: string;
  experienceLevel?: string;
  workingHours?: string;
  serviceAreas?: string;
  priceTiers?: PriceTier[];
}

export interface PriceTier {
  name: string;
  price: number;
  description: string;
  includes: string[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  serviceCount: number;
  createdAt: string;
  updatedAt: string;
  subcategories: string[];
  popularServices: string[];
  tags: string[];
  requiresKYC: boolean;
  requiresLocation: boolean;
  allowsCustomPricing: boolean;
  defaultPriceUnit: string;
  defaultDuration: string;
}

export interface ServiceSearchParams {
  query?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  pincode?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'rating' | 'popularity' | 'name';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  isActive?: boolean;
  isPopular?: boolean;
  page?: number;
  size?: number;
}

export interface ServiceRequest {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  icon?: string;
  image?: string;
  basePrice: number;
  priceUnit?: string;
  duration?: string;
  tags?: string[];
  requirements?: string[];
  benefits?: string[];
  isCustom?: boolean;
  toolsRequired?: string;
  skillsRequired?: string;
  experienceLevel?: string;
  workingHours?: string;
  serviceAreas?: string;
  priceTiers?: PriceTierRequest[];
}

export interface PriceTierRequest {
  name: string;
  price: number;
  description: string;
  includes: string[];
}

export interface ServiceFormData {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  duration: string;
  tags: string[];
  requirements: string[];
  benefits: string[];
  toolsRequired: string;
  skillsRequired: string;
  experienceLevel: string;
  workingHours: string;
  serviceAreas: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
