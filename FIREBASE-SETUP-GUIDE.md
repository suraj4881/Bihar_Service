# Firebase OTP Authentication Setup Guide

## Complete Firebase Integration for BiharSeva

This guide covers the complete setup of Firebase Authentication with Phone OTP for both frontend and backend.

---

## 📱 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter Project Name: `BiharSeva` or your preferred name
4. Disable Google Analytics (optional)
5. Click **"Create Project"**

---

## 🔐 Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get Started"**
3. Go to **"Sign-in method"** tab
4. Find **"Phone"** provider
5. Click to enable it
6. Save changes

---

## 🔑 Step 3: Get Firebase Admin SDK Credentials (Backend)

### Generate Service Account Key

1. In Firebase Console, click the gear icon ⚙️ → **"Project Settings"**
2. Go to **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. Click **"Generate Key"** to download JSON file
5. Rename the file to `firebase-service-account.json`
6. Place it in your project at: `src/main/resources/firebase-service-account.json`

**Important:** Add this file to `.gitignore`:
```
src/main/resources/firebase-service-account.json
```

---

## 🌐 Step 4: Get Firebase Web Config (Frontend)

### Get Web App Configuration

1. In Firebase Console → Project Settings
2. Scroll down to **"Your apps"**
3. Click the **Web icon** (</>) to add a web app
4. Register app name: `BiharSeva Web`
5. Copy the `firebaseConfig` object

---

## ⚙️ Step 5: Backend Configuration

### A. Add Firebase Admin SDK to pom.xml

Already added:
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

### B. Place Service Account File

Copy `firebase-service-account.json` to:
```
src/main/resources/firebase-service-account.json
```

### C. Firebase Auto-Configuration

The `FirebaseConfig.java` automatically initializes Firebase:
```java
@Configuration
public class FirebaseConfig {
    @PostConstruct
    public void initialize() {
        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(
                new ClassPathResource("firebase-service-account.json").getInputStream()))
            .build();
        
        FirebaseApp.initializeApp(options);
    }
}
```

### D. Verify Backend Setup

Start your backend and check logs:
```bash
mvn spring-boot:run
```

Look for:
```
Firebase Admin SDK initialized successfully
```

---

## 🎨 Step 6: Frontend Configuration

### A. Install Firebase SDK

```bash
cd bihar-seva-frontend
npm install firebase
```

### B. Create Firebase Config File

Create `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxx"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
```

### C. Create OTP Authentication Service

Create `src/services/firebaseAuth.js`:

```javascript
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/firebase-auth';

class FirebaseAuthService {
  // Setup reCAPTCHA
  setupRecaptcha(containerId) {
    window.recaptchaVerifier = new RecaptchaVerifier(containerId, {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA verified');
      }
    }, auth);
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber) {
    try {
      // Ensure phone number has +91 prefix
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        appVerifier
      );
      
      window.confirmationResult = confirmationResult;
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: error.message };
    }
  }

  // Verify OTP
  async verifyOTP(code) {
    try {
      const result = await window.confirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();
      return { success: true, idToken, user: result.user };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: error.message };
    }
  }

  // Check if phone exists in database
  async checkPhone(phoneNumber) {
    try {
      const response = await axios.get(`${API_URL}/check-phone`, {
        params: { phone: phoneNumber }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking phone:', error);
      throw error;
    }
  }

  // Verify with backend and login
  async verifyAndLogin(idToken, userData = {}) {
    try {
      const response = await axios.post(`${API_URL}/verify-and-login`, null, {
        params: {
          idToken,
          role: userData.role,
          name: userData.name,
          email: userData.email
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying with backend:', error);
      throw error;
    }
  }

  // Complete registration
  async completeRegistration(userData) {
    try {
      const response = await axios.post(`${API_URL}/complete-registration`, null, {
        params: userData
      });
      return response.data;
    } catch (error) {
      console.error('Error completing registration:', error);
      throw error;
    }
  }
}

export default new FirebaseAuthService();
```

---

## 📱 Step 7: Implement Login/Register Page

Create `src/pages/FirebaseLoginPage.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import firebaseAuthService from '../services/firebaseAuth';

function FirebaseLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Setup reCAPTCHA on component mount
    firebaseAuthService.setupRecaptcha('recaptcha-container');
  }, []);

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if phone exists first
      const checkResult = await firebaseAuthService.checkPhone(phoneNumber);
      console.log('Phone check:', checkResult);

      // Send OTP
      const result = await firebaseAuthService.sendOTP(phoneNumber);
      
      if (result.success) {
        setShowOTP(true);
        setError('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP with Firebase
      const result = await firebaseAuthService.verifyOTP(otp);
      
      if (result.success) {
        // Verify with backend
        const backendResult = await firebaseAuthService.verifyAndLogin(
          result.idToken,
          { role: 'CUSTOMER', name: 'User', email: '' }
        );

        if (backendResult.success) {
          // Store token and redirect
          localStorage.setItem('token', backendResult.data.token);
          localStorage.setItem('user', JSON.stringify(backendResult.data.user));
          localStorage.setItem('role', backendResult.data.role);

          // Redirect based on role
          if (backendResult.data.role === 'PROVIDER') {
            window.location.href = '/provider-dashboard';
          } else {
            window.location.href = '/customer-dashboard';
          }
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div id="recaptcha-container"></div>
      
      <h2>Login / Register</h2>
      
      {!showOTP ? (
        <div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter 10-digit mobile number"
            maxLength="10"
          />
          <button onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
          />
          <button onClick={handleVerifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button onClick={() => setShowOTP(false)}>Change Number</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default FirebaseLoginPage;
```

---

## 🧪 Step 8: Testing

### Test OTP Flow

1. **Start Backend:**
```bash
mvn spring-boot:run
```

2. **Start Frontend:**
```bash
cd bihar-seva-frontend
npm start
```

3. **Open Browser:**
Go to `http://localhost:3000/login`

4. **Enter Phone Number:**
Enter a valid 10-digit Indian mobile number

5. **Receive OTP:**
You'll receive OTP on your phone

6. **Enter OTP:**
Enter the 6-digit OTP

7. **Logged In:**
You should be logged in and redirected to dashboard

### Test with Postman

```
POST http://localhost:8080/api/firebase-auth/verify-and-login
?idToken=FIREBASE_ID_TOKEN
&role=CUSTOMER
&name=John
&email=john@example.com
```

---

## 🔍 Troubleshooting

### Firebase not initialized
**Solution:** Check if `firebase-service-account.json` exists in `src/main/resources/`

### reCAPTCHA error
**Solution:** Ensure reCAPTCHA is setup before sending OTP:
```javascript
firebaseAuthService.setupRecaptcha('recaptcha-container');
```

### OTP not received
**Solution:** 
1. Check Firebase console for errors
2. Verify phone number format (+91XXXXXXXXXX)
3. Check Firebase billing (requires Blaze plan for production)

### Backend token verification fails
**Solution:** 
1. Ensure Firebase service account JSON is correct
2. Check backend logs for detailed error
3. Verify idToken is not expired

---

## 🎯 Production Checklist

### Frontend
- [ ] Replace Firebase config with production keys
- [ ] Enable Firebase App Check
- [ ] Add error tracking (Sentry)
- [ ] Implement retry logic for OTP
- [ ] Add phone number validation
- [ ] Implement session timeout
- [ ] Add loading states

### Backend
- [ ] Move Firebase credentials to environment variables
- [ ] Enable rate limiting on OTP endpoints
- [ ] Add monitoring and logging
- [ ] Implement token refresh
- [ ] Add fraud detection
- [ ] Setup backup authentication method
- [ ] Configure CORS properly

### Firebase Console
- [ ] Upgrade to Blaze plan for production
- [ ] Set usage quotas
- [ ] Enable App Check
- [ ] Configure authorized domains
- [ ] Setup Firebase monitoring
- [ ] Enable security rules

---

## 📞 Support

For issues, please check:
1. Firebase Console logs
2. Backend application logs
3. Browser console errors
4. Network tab in DevTools

---

**Firebase OTP Authentication is now complete! 🎉**

