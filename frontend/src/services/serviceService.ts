import axios from 'axios';
import { Service, ServiceCategory, ServiceSearchParams, ServiceRequest, ApiResponse } from '../types/service';
import { API_BASE_URL } from '../utils/api';

export const serviceService = {
  // Get all services
  async getAllServices(): Promise<ApiResponse<Service[]>> {
    const response = await axios.get(`${API_BASE_URL}/services/all`);
    return response.data;
  },

  // Search services with filters
  async searchServices(params: ServiceSearchParams): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.query) queryParams.append('query', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params.city) queryParams.append('city', params.city);
    if (params.pincode) queryParams.append('pincode', params.pincode);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.tags) queryParams.append('tags', params.tags.join(','));
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.isPopular !== undefined) queryParams.append('isPopular', params.isPopular.toString());
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const response = await axios.get(`${API_BASE_URL}/services?${queryParams.toString()}`);
    return response.data;
  },

  // Get services by category
  async getServicesByCategory(category: string): Promise<ApiResponse<Service[]>> {
    const response = await axios.get(`${API_BASE_URL}/services/category/${encodeURIComponent(category)}`);
    return response.data;
  },

  // Get popular services
  async getPopularServices(): Promise<ApiResponse<Service[]>> {
    const response = await axios.get(`${API_BASE_URL}/services/popular`);
    return response.data;
  },

  // Get custom services
  async getCustomServices(createdBy: string): Promise<ApiResponse<Service[]>> {
    const response = await axios.get(`${API_BASE_URL}/services/custom/${createdBy}`);
    return response.data;
  },

  // Get service by ID
  async getServiceById(id: string): Promise<ApiResponse<Service>> {
    const response = await axios.get(`${API_BASE_URL}/services/${id}`);
    return response.data;
  },

  // Create new service
  async createService(serviceRequest: ServiceRequest): Promise<ApiResponse<Service>> {
    const response = await axios.post(`${API_BASE_URL}/services`, serviceRequest);
    return response.data;
  },

  // Update service
  async updateService(id: string, serviceRequest: ServiceRequest): Promise<ApiResponse<Service>> {
    const response = await axios.put(`${API_BASE_URL}/services/${id}`, serviceRequest);
    return response.data;
  },

  // Delete service
  async deleteService(id: string): Promise<ApiResponse<string>> {
    const response = await axios.delete(`${API_BASE_URL}/services/${id}`);
    return response.data;
  },

  // Increment booking count
  async incrementBookingCount(id: string): Promise<ApiResponse<string>> {
    const response = await axios.post(`${API_BASE_URL}/services/${id}/increment-booking`);
    return response.data;
  },

  // Get service categories
  async getCategories(): Promise<ApiResponse<ServiceCategory[]>> {
    const response = await axios.get(`${API_BASE_URL}/service-categories`);
    return response.data;
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<ApiResponse<ServiceCategory>> {
    const response = await axios.get(`${API_BASE_URL}/service-categories/${id}`);
    return response.data;
  },

  // Create category
  async createCategory(category: Partial<ServiceCategory>): Promise<ApiResponse<ServiceCategory>> {
    const response = await axios.post(`${API_BASE_URL}/service-categories`, category);
    return response.data;
  },

  // Update category
  async updateCategory(id: string, category: Partial<ServiceCategory>): Promise<ApiResponse<ServiceCategory>> {
    const response = await axios.put(`${API_BASE_URL}/service-categories/${id}`, category);
    return response.data;
  },

  // Delete category
  async deleteCategory(id: string): Promise<ApiResponse<string>> {
    const response = await axios.delete(`${API_BASE_URL}/service-categories/${id}`);
    return response.data;
  }
};
