# BiharSeva - Service Marketplace Platform

**Complete service marketplace connecting customers with verified service providers in Bihar**

## 🚀 Features

### Firebase OTP Authentication
- ✅ Phone number-based OTP login/signup
- ✅ Firebase Admin SDK integration
- ✅ Automatic user creation on first login
- ✅ Role-based access (Customer/Provider/Admin)
- ✅ JWT token generation after Firebase verification

### Customer Features
- Search and filter service providers
- Book services with scheduling
- Track booking status
- Rate and review providers
- Real-time notifications
- Booking history

### Provider Features
- Complete dashboard with earnings tracking
- Job management (accept/reject/complete)
- Earnings by period (today/week/month)
- KYC document upload
- Profile management
- Customer reviews and responses

### Admin Features
- Comprehensive dashboard
- User and provider management
- KYC verification workflow
- Booking oversight
- Category management
- Review moderation

## 📋 Prerequisites

- Java 11+
- MongoDB 4.4+
- Node.js 14+ (for frontend)
- Firebase Project (for OTP authentication)
- Maven 3.6+

## 🔧 Backend Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd BiharSeva
```

### 2. Configure MongoDB
Update `src/main/resources/application.properties`:
```properties
spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.database=bihar_seva
```

### 3. Configure Firebase

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** → **Phone** sign-in method

#### B. Download Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `firebase-service-account.json`
4. Place it in `src/main/resources/` folder

#### C. Add Firebase to Frontend
1. Go to Project Settings → General
2. Add a Web App
3. Copy the Firebase config
4. Update `bihar-seva-frontend/src/config/firebase.js`

### 4. Build and Run
```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

Server will start at: `http://localhost:8080`

## 🎨 Frontend Setup

### 1. Navigate to frontend directory
```bash
cd bihar-seva-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
Create `src/config/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 4. Run the development server
```bash
npm start
```

Frontend will start at: `http://localhost:3000`

## 🔐 Firebase OTP Authentication Flow

### Frontend (React/Web)
```javascript
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from './config/firebase';

// 1. Setup reCAPTCHA
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
  size: 'invisible'
}, auth);

// 2. Send OTP
const phoneNumber = '+919876543210'; // Must include +91
const appVerifier = window.recaptchaVerifier;

signInWithPhoneNumber(auth, phoneNumber, appVerifier)
  .then((confirmationResult) => {
    // OTP sent successfully
    window.confirmationResult = confirmationResult;
  });

// 3. Verify OTP
const code = '123456'; // User entered OTP
window.confirmationResult.confirm(code)
  .then((result) => {
    // Get Firebase ID token
    result.user.getIdToken().then((idToken) => {
      // Send to backend for verification
      verifyWithBackend(idToken);
    });
  });
```

### Backend Verification
```javascript
// Call backend API
POST http://localhost:8080/api/firebase-auth/verify-and-login
Content-Type: application/json

{
  "idToken": "FIREBASE_ID_TOKEN",
  "role": "CUSTOMER",  // or "PROVIDER"
  "name": "John Doe",
  "email": "john@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "role": "CUSTOMER",
    "token": "JWT_TOKEN",
    "isNewUser": false
  }
}
```

## 📡 API Endpoints

### Firebase Authentication
- **POST** `/api/firebase-auth/verify-and-login` - Verify Firebase token and login/register
- **GET** `/api/firebase-auth/check-phone?phone=9876543210` - Check if phone exists
- **POST** `/api/firebase-auth/complete-registration` - Complete registration for new users
- **GET** `/api/firebase-auth/status` - Check Firebase configuration status

### Search & Discovery
- **GET** `/api/search/providers?skill=plumber&city=Patna&verified=true&minRating=4.0`
- **GET** `/api/search/providers/top-rated?limit=10`
- **GET** `/api/search/providers/nearby?city=Patna&skill=electrician`

### Bookings
- **POST** `/api/bookings` - Create booking
- **GET** `/api/bookings/user/{userId}` - Get user bookings
- **GET** `/api/bookings/provider/{providerId}` - Get provider bookings
- **PUT** `/api/bookings/{id}/accept` - Provider accept booking
- **PUT** `/api/bookings/{id}/complete` - Mark booking as completed
- **PUT** `/api/bookings/{id}/cancel` - Cancel booking

### Provider Management
- **GET** `/api/providers/{id}/dashboard` - Provider dashboard stats
- **GET** `/api/providers/{id}/earnings` - Get earnings summary
- **GET** `/api/providers/{id}/earnings/period?period=month` - Earnings by period

### Reviews
- **POST** `/api/reviews` - Create review
- **GET** `/api/reviews/provider/{providerId}` - Get provider reviews
- **PUT** `/api/reviews/{reviewId}/response?response=Thank you!` - Provider response

### Notifications
- **GET** `/api/notifications/user/{userId}` - Get user notifications
- **GET** `/api/notifications/user/{userId}/unread-count` - Get unread count
- **PUT** `/api/notifications/{id}/read` - Mark as read

### Admin
- **GET** `/api/admin/dashboard/stats` - Admin dashboard statistics
- **GET** `/api/admin/kyc/pending` - Get pending KYC documents
- **PUT** `/api/admin/kyc/{kycId}/approve?adminId=admin123` - Approve KYC
- **PUT** `/api/admin/kyc/{kycId}/reject?adminId=admin123&reason=Invalid` - Reject KYC

For complete API documentation, see [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)

## 🗂️ Project Structure

```
BiharSeva/
├── src/main/java/com/bihar/seva/
│   ├── config/
│   │   ├── FirebaseConfig.java        # Firebase initialization
│   │   └── SecurityConfig.java         # Spring Security config
│   ├── controller/
│   │   ├── FirebaseAuthController.java # Firebase OTP endpoints
│   │   ├── ProviderController.java
│   │   ├── BookingController.java
│   │   ├── SearchController.java
│   │   ├── ReviewController.java
│   │   ├── NotificationController.java
│   │   └── AdminController.java
│   ├── service/
│   │   ├── FirebaseAuthService.java    # Firebase operations
│   │   ├── ProviderSearchService.java
│   │   ├── BookingService.java
│   │   ├── ReviewService.java
│   │   ├── NotificationService.java
│   │   └── EarningsService.java
│   ├── model/                          # MongoDB entities
│   ├── repositories/                   # Data access layer
│   └── dto/                           # Data transfer objects
├── bihar-seva-frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       └── config/
│           └── firebase.js            # Firebase frontend config
└── src/main/resources/
    ├── application.properties
    └── firebase-service-account.json  # Add this file
```

## 🔒 Security Features

- Firebase phone OTP verification
- JWT token-based authentication
- Password hashing with BCrypt
- Role-based access control (CUSTOMER, PROVIDER, ADMIN)
- Input validation
- CORS configuration
- Secure file upload

## 📊 Database Schema (MongoDB)

### Collections
- `users` - Customer accounts
- `providers` - Service provider accounts
- `bookings` - Service bookings
- `reviews` - Customer reviews
- `notifications` - User notifications
- `earnings` - Provider earnings tracking
- `kyc_documents` - Identity verification documents
- `service_categories` - Service categories

## 🎯 Key Features Implemented

✅ Firebase OTP authentication
✅ Advanced provider search with filters
✅ Complete booking lifecycle management
✅ Earnings tracking with commission
✅ Review and rating system
✅ Real-time notifications
✅ KYC verification workflow
✅ Admin dashboard with analytics
✅ Provider dashboard with insights
✅ Customer dashboard
✅ Role-based access control

## 🚀 Deployment

### Backend Deployment (Heroku/AWS/DigitalOcean)
```bash
# Build JAR file
mvn clean package

# Run JAR
java -jar target/bihar-seva-backend-0.0.1-SNAPSHOT.jar
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build for production
cd bihar-seva-frontend
npm run build

# Deploy dist folder
```

### Environment Variables
```properties
# Backend
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
FIREBASE_CREDENTIALS=firebase-service-account.json

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
```

## 📱 Testing

### Test Firebase OTP Locally
1. Start backend: `mvn spring-boot:run`
2. Start frontend: `cd bihar-seva-frontend && npm start`
3. Open browser: `http://localhost:3000`
4. Register/Login with phone number
5. Enter OTP received on phone
6. Backend verifies Firebase token
7. User logged in successfully

### Test API with Postman
1. Get Firebase ID token from frontend
2. Call `/api/firebase-auth/verify-and-login` with token
3. Use returned JWT token for subsequent API calls

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email suraj4881@gmail.com or open an issue in the repository.

## 🎉 Acknowledgments

- Firebase for authentication
- Spring Boot for backend framework
- React for frontend
- MongoDB for database
- All contributors and users

---

Made with ❤️ for Bihar Service Marketplace
#   B i h a r _ S e r v i c e  
 