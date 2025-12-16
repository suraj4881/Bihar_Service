# BiharSeva API Documentation

## Overview
BiharSeva is a comprehensive service marketplace platform connecting customers with verified service providers in Bihar.

## Base URL
```
http://localhost:8080/api
```

## Authentication APIs

### 1. Register User/Customer
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "address": "Sample Address",
  "city": "Patna",
  "pincode": "800001"
}
```

### 2. Register Provider
**POST** `/auth/register/provider`

**Request Body:**
```json
{
  "name": "Provider Name",
  "email": "provider@example.com",
  "phone": "9876543210",
  "password": "password123",
  "skill": "Plumber",
  "city": "Patna",
  "price": 500,
  "experience": "5 years"
}
```

### 3. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Customer APIs

### 1. Get Customer Dashboard
**GET** `/customer/{userId}/dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard retrieved",
  "data": {
    "user": {...},
    "totalBookings": 10,
    "upcomingBookings": 2,
    "completedBookings": 8,
    "unreadNotifications": 3
  }
}
```

## Provider APIs

### 1. Get All Providers
**GET** `/providers`

### 2. Get Verified Providers
**GET** `/providers/verified`

### 3. Get Provider by ID
**GET** `/providers/{id}`

### 4. Get Provider Dashboard
**GET** `/providers/{id}/dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard retrieved",
  "data": {
    "todayBookings": 5,
    "pendingRequests": 3,
    "completedBookings": 120,
    "totalEarnings": 50000,
    "pendingEarnings": 5000,
    "rating": 4.5,
    "totalBookings": 150,
    "isVerified": true
  }
}
```

### 5. Get Provider Bookings
**GET** `/providers/{id}/bookings?status=PENDING`

### 6. Get Provider Earnings
**GET** `/providers/{id}/earnings`

### 7. Get Earnings by Period
**GET** `/providers/{id}/earnings/period?period=month`

**Periods:** today, week, month

### 8. Get Provider Reviews
**GET** `/providers/{id}/reviews`

### 9. Update Provider Profile
**PUT** `/providers/{id}`

## Search APIs

### 1. Advanced Provider Search
**GET** `/search/providers`

**Query Parameters:**
- `skill` - Service type (e.g., "plumber")
- `city` - City name
- `verified` - true/false
- `minRating` - Minimum rating (0-5)
- `maxPrice` - Maximum price
- `minPrice` - Minimum price
- `sortBy` - rating, price_low, price_high, bookings

**Example:**
```
GET /search/providers?skill=plumber&city=Patna&verified=true&minRating=4.0&sortBy=rating
```

### 2. Get Providers by Category
**GET** `/search/providers/category/{category}`

### 3. Get Top Rated Providers
**GET** `/search/providers/top-rated?limit=10`

### 4. Get Nearby Providers
**GET** `/search/providers/nearby?city=Patna&skill=electrician`

### 5. Get Recommended Providers
**GET** `/search/providers/recommended?userId={userId}`

## Booking APIs

### 1. Create Booking
**POST** `/bookings`

**Request Body:**
```json
{
  "userId": "user123",
  "providerId": "provider123",
  "service": "Plumbing Service",
  "address": "123 Main St",
  "city": "Patna",
  "pincode": "800001",
  "scheduledDate": "2024-12-01T10:00:00",
  "price": 500,
  "specialInstructions": "Please call before arriving",
  "emergencyContact": "John Doe",
  "emergencyPhone": "9876543210"
}
```

### 2. Get All Bookings
**GET** `/bookings`

### 3. Get Booking by ID
**GET** `/bookings/{id}`

### 4. Get User Bookings
**GET** `/bookings/user/{userId}?status=CONFIRMED`

### 5. Get Provider Bookings
**GET** `/bookings/provider/{providerId}?status=PENDING`

### 6. Provider Accept Booking
**PUT** `/bookings/{id}/accept`

### 7. Provider Reject Booking
**PUT** `/bookings/{id}/reject?reason=Not available`

### 8. Mark Booking as Completed
**PUT** `/bookings/{id}/complete`

### 9. Customer Cancel Booking
**PUT** `/bookings/{id}/cancel?reason=Change of plans`

### 10. Update Booking Status
**PUT** `/bookings/{id}/status?status=IN_PROGRESS`

**Statuses:** PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED

### 11. Add Rating and Review
**PUT** `/bookings/{id}/rating?rating=5&feedback=Excellent service!`

## Review APIs

### 1. Create Review
**POST** `/reviews`

**Request Body:**
```json
{
  "bookingId": "booking123",
  "providerId": "provider123",
  "customerId": "customer123",
  "customerName": "John Doe",
  "rating": 5,
  "comment": "Excellent service!",
  "service": "Plumbing"
}
```

### 2. Get Provider Reviews
**GET** `/reviews/provider/{providerId}`

### 3. Get Customer Reviews
**GET** `/reviews/customer/{customerId}`

### 4. Get Review by Booking
**GET** `/reviews/booking/{bookingId}`

### 5. Add Provider Response
**PUT** `/reviews/{reviewId}/response?response=Thank you for your feedback!`

### 6. Admin: Get Pending Reviews
**GET** `/reviews/pending`

### 7. Admin: Approve Review
**PUT** `/reviews/{reviewId}/approve`

### 8. Delete Review
**DELETE** `/reviews/{reviewId}`

## Notification APIs

### 1. Get User Notifications
**GET** `/notifications/user/{userId}`

### 2. Get Unread Notifications
**GET** `/notifications/user/{userId}/unread`

### 3. Get Unread Count
**GET** `/notifications/user/{userId}/unread-count`

### 4. Mark as Read
**PUT** `/notifications/{notificationId}/read`

### 5. Mark All as Read
**PUT** `/notifications/user/{userId}/read-all`

### 6. Delete Notification
**DELETE** `/notifications/{notificationId}`

### 7. Create Notification (Admin/System)
**POST** `/notifications`

**Request Body:**
```json
{
  "userId": "user123",
  "title": "New Booking",
  "message": "You have a new booking request",
  "type": "BOOKING",
  "priority": "NORMAL"
}
```

## KYC APIs

### 1. Upload KYC Document
**POST** `/kyc/upload`

**Request Body:**
```json
{
  "userId": "provider123",
  "documentType": "AADHAR",
  "documentNumber": "123456789012",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "address": "Sample Address",
  "pincode": "800001",
  "state": "Bihar",
  "documentFrontImage": "base64_encoded_image",
  "documentBackImage": "base64_encoded_image",
  "selfieImage": "base64_encoded_image"
}
```

**Document Types:** AADHAR, PAN, VOTER, DRIVER_LICENSE

### 2. Get KYC Status
**GET** `/kyc/status/{userId}`

### 3. Get User KYC Documents
**GET** `/kyc/documents/{userId}`

## Admin APIs

### 1. Get Dashboard Stats
**GET** `/admin/dashboard/stats`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard stats retrieved",
  "data": {
    "totalUsers": 1000,
    "activeUsers": 850,
    "verifiedUsers": 800,
    "totalProviders": 200,
    "activeProviders": 180,
    "verifiedProviders": 150,
    "pendingKYC": 20,
    "totalBookings": 5000,
    "todayBookings": 50,
    "pendingBookings": 30,
    "confirmedBookings": 15,
    "completedBookings": 4500,
    "totalRevenue": 2500000,
    "todayRevenue": 25000
  }
}
```

### 2. User Management

**Get All Users**
**GET** `/admin/users`

**Toggle User Status**
**PUT** `/admin/users/{userId}/toggle-status`

### 3. Provider Management

**Get All Providers**
**GET** `/admin/providers`

**Toggle Provider Status**
**PUT** `/admin/providers/{providerId}/toggle-status`

### 4. KYC Management

**Get Pending KYC**
**GET** `/admin/kyc/pending`

**Get KYC Details**
**GET** `/admin/kyc/{kycId}`

**Approve KYC**
**PUT** `/admin/kyc/{kycId}/approve?adminId=admin123`

**Reject KYC**
**PUT** `/admin/kyc/{kycId}/reject?adminId=admin123&reason=Invalid document`

### 5. Booking Management

**Get All Bookings**
**GET** `/admin/bookings`

### 6. Category Management

**Get All Categories**
**GET** `/admin/categories`

**Create Category**
**POST** `/admin/categories`

**Update Category**
**PUT** `/admin/categories/{categoryId}`

**Delete Category**
**DELETE** `/admin/categories/{categoryId}`

**Toggle Category Status**
**PUT** `/admin/categories/{categoryId}/toggle-status`

## Service Categories APIs

### 1. Get All Active Categories
**GET** `/categories`

### 2. Get Category by ID
**GET** `/categories/{id}`

### 3. Search Categories
**GET** `/categories/search?q=plumber`

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "error": "Detailed error"
}
```

## Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Booking Statuses

- `PENDING` - Awaiting provider acceptance
- `CONFIRMED` - Provider accepted
- `IN_PROGRESS` - Service in progress
- `COMPLETED` - Service completed
- `CANCELLED` - Booking cancelled

## KYC Statuses

- `PENDING` - Awaiting admin review
- `VERIFIED` - KYC approved
- `REJECTED` - KYC rejected
- `EXPIRED` - Document expired

## Notification Types

- `BOOKING` - Booking related
- `PAYMENT` - Payment related
- `KYC` - KYC related
- `REVIEW` - Review related
- `PROMOTION` - Promotional
- `SYSTEM` - System notifications

## Features Implemented

### ✅ Public Screens
- Home page with search
- Provider listing
- Provider profile (public)
- Service categories
- Advanced search with filters

### ✅ Authentication
- User registration
- Provider registration
- Login
- JWT authentication

### ✅ Customer Features
- Dashboard with stats
- Search providers (skill, city, rating, price)
- View provider profiles
- Create bookings
- Track booking status
- Cancel bookings
- Rate and review providers
- View booking history
- Notifications

### ✅ Provider Features
- Dashboard with earnings & bookings
- Accept/Reject bookings
- Mark service as completed
- View earnings (today, week, month)
- Manage profile
- Upload KYC documents
- View reviews
- Respond to reviews
- Job management

### ✅ Admin Features
- Comprehensive dashboard
- User management
- Provider management
- KYC review & approval
- Booking overview
- Category management
- Review moderation
- System statistics

### ✅ Advanced Features
- Real-time notifications
- Earnings tracking
- Review & rating system
- KYC verification workflow
- Multi-filter search
- Verified provider badges
- Top-rated providers
- Recommended providers
- Provider search by location

## Notes

- All endpoints require appropriate authentication (JWT token)
- MongoDB is used as the database
- File uploads (KYC) are stored in `/uploads/kyc/` directory
- Images should be sent as base64 encoded strings
- Dates should be in ISO 8601 format
- Phone numbers must be valid Indian mobile numbers (10 digits starting with 6-9)
- Commission rate is 15% on all bookings

