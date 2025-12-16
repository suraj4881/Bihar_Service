# 🚀 BiharSeva - Quick Start Guide

## Get Started in 5 Minutes!

---

## ✅ Prerequisites

- Java 11+
- Maven 3.6+
- MongoDB 4.4+
- Node.js 14+ (for frontend)
- Firebase Account

---

## 🔥 Step 1: Firebase Setup (2 minutes)

### Get Service Account Key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/Select project
3. Enable **Authentication** → **Phone**
4. Go to **Project Settings** → **Service Accounts**
5. Click **"Generate New Private Key"**
6. Save as `firebase-service-account.json`

### Place the file:
```bash
mv firebase-service-account.json C:/personal/BiharSeva/src/main/resources/
```

---

## 🖥️ Step 2: Start Backend (2 minutes)

```bash
# Navigate to project
cd C:/personal/BiharSeva

# Build project
mvn clean install -DskipTests

# Run application
mvn spring-boot:run
```

**Expected Output:**
```
✅ Firebase Admin SDK initialized successfully
✅ Server started on port 8080
```

---

## 🎨 Step 3: Setup Frontend (3 minutes)

### Install dependencies:
```bash
cd bihar-seva-frontend
npm install
```

### Update Firebase Config:

Edit `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Start frontend:
```bash
npm start
```

**Opens at:** http://localhost:3000

---

## ✅ Step 4: Test OTP Login (1 minute)

1. Open http://localhost:3000
2. Enter phone number (10 digits)
3. Click "Send OTP"
4. Enter OTP received on phone
5. **Logged in!** 🎉

---

## 📡 Test API

### Check Firebase Status:
```bash
curl http://localhost:8080/api/firebase-auth/status
```

### Check Phone:
```bash
curl http://localhost:8080/api/firebase-auth/check-phone?phone=9876543210
```

### Get All Providers:
```bash
curl http://localhost:8080/api/providers
```

---

## 🗂️ Project URLs

- **Backend:** http://localhost:8080
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8080/actuator
- **MongoDB:** mongodb://localhost:27017/bihar_seva

---

## 📚 Documentation

- **Setup Guide:** `FIREBASE-SETUP-GUIDE.md`
- **API Reference:** `API-DOCUMENTATION.md`
- **Complete Guide:** `FIREBASE-INTEGRATION-COMPLETE.md`

---

## 🎯 Features Available

### Customer:
✅ Search providers with filters
✅ Book services
✅ Track bookings
✅ Rate & review
✅ Notifications

### Provider:
✅ Dashboard with earnings
✅ Accept/Reject jobs
✅ Complete bookings
✅ Profile management
✅ KYC upload
✅ View reviews

### Admin:
✅ Complete dashboard
✅ User/Provider management
✅ KYC verification
✅ Booking overview
✅ Category management

---

## ⚠️ Troubleshooting

### Firebase Not Initialized?
- Check `firebase-service-account.json` exists in `src/main/resources/`
- Verify JSON file is valid

### OTP Not Received?
- Enable Phone Auth in Firebase Console
- Upgrade to Blaze plan for production
- Check phone number format (+91XXXXXXXXXX)

### Port Already in Use?
```bash
# Kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

---

## 🎉 You're All Set!

**Your BiharSeva platform is now running with:**

- ✅ Firebase OTP Authentication
- ✅ Complete Backend APIs
- ✅ Frontend Application
- ✅ MongoDB Database
- ✅ Real-time Notifications
- ✅ Provider Search
- ✅ Booking System
- ✅ Reviews & Ratings

**Happy Coding! 🚀**

