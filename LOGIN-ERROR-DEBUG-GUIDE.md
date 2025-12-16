# 🐛 LOGIN ERROR - "Invalid credentials" DEBUGGING GUIDE

## **❌ PROBLEM:**

```
Register → Email Verification → Login
Error: "Invalid credentials"
```

---

## **🔍 POSSIBLE CAUSES:**

### **1. Password Not Saved Properly**
```
- Password field is NULL in database
- Password not encrypted during registration
- Password corrupted during save
```

### **2. Password Mismatch**
```
- User entering wrong password
- Password changed after registration
- Encryption algorithm mismatch
```

### **3. User Not Found**
```
- Email typo during login
- User deleted from database
- Case sensitivity issue
```

### **4. Email Not Verified**
```
- isVerified still false after verification
- Verification code not cleared
```

---

## **✅ DEBUGGING STEPS:**

### **Step 1: Check User in Database**

```bash
# Open MongoDB
mongosh

# Use database
use bihar_seva

# Find user by email
db.users.findOne({ email: "your-email@example.com" })

# Check these fields:
# ✅ password: Should be encrypted (starts with $2a$ or $2b$)
# ✅ isVerified: Should be true
# ✅ isActive: Should be true
# ✅ verificationCode: Should be null after verification
```

### **Step 2: Use Debug Endpoint**

```bash
# Check user details via API
curl http://localhost:8080/api/debug/user/your-email@example.com

# Response should show:
{
  "success": true,
  "data": {
    "email": "your-email@example.com",
    "isVerified": true,
    "isActive": true,
    "hasPassword": true,
    "passwordHash": "$2a$10$abcd..."
  }
}
```

### **Step 3: Check Backend Logs**

```bash
# Look for these logs during login:

🔍 Login attempt - Email: user@example.com
🔍 Password provided: abc***, Stored password hash: $2a$10$...
✅ Password matched for user: user@example.com

# OR

❌ Password mismatch for user: user@example.com
```

### **Step 4: Test with Fresh Registration**

```bash
# 1. Register new user
Email: test123@example.com
Password: Test@123

# 2. Check backend logs:
🔐 Password encoded for user: test123@example.com, hash: $2a$10$...

# 3. Verify email

# 4. Try login with EXACT same password
```

---

## **🔧 FIXES APPLIED:**

### **1. Added Debug Logging**

**File:** `AuthService.java`

```java
// During registration
logger.info("🔐 Password encoded for user: {}, hash: {}", 
    email, encodedPassword.substring(0, 10) + "...");

// During login
logger.info("🔍 Login attempt - Email: {}, Password: {}***, Hash: {}...",
    email, password.substring(0, 3), storedHash.substring(0, 10));

if (passwordMatch) {
    logger.info("✅ Password matched");
} else {
    logger.warn("❌ Password mismatch");
}
```

### **2. Created Debug Endpoint**

**Endpoint:** `GET /api/debug/user/{email}`

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "isVerified": true,
  "isActive": true,
  "hasPassword": true,
  "passwordHash": "$2a$10$abcd...",
  "verificationCode": null
}
```

---

## **🚀 TESTING PROCEDURE:**

### **Test 1: Complete Flow**

```bash
# 1. Start backend with logs
mvn spring-boot:run

# 2. Register new user
POST http://localhost:8080/api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@123",
  "phone": "9876543210",
  "city": "Patna"
}

# 3. Check logs for:
🔐 Password encoded for user: test@example.com

# 4. Check email for verification code

# 5. Verify email
POST http://localhost:8080/api/email-verification/verify
?email=test@example.com&code=123456

# 6. Check user details
GET http://localhost:8080/api/debug/user/test@example.com

# Should show:
isVerified: true
hasPassword: true

# 7. Login
POST http://localhost:8080/api/auth/login
{
  "email": "test@example.com",
  "password": "Test@123"
}

# 8. Check logs for:
🔍 Login attempt - Email: test@example.com
✅ Password matched
```

### **Test 2: Check Database Directly**

```javascript
// In MongoDB
db.users.findOne({ email: "test@example.com" })

// Should return:
{
  _id: "...",
  email: "test@example.com",
  password: "$2a$10$...",  // ✅ Encrypted
  isVerified: true,         // ✅ True after verification
  isActive: true,           // ✅ True
  verificationCode: null,   // ✅ Null after verification
  _class: "com.bihar.seva.model.User"
}
```

---

## **💡 COMMON ISSUES & SOLUTIONS:**

### **Issue 1: Password is NULL**

```
Problem: password field is null in database
Solution: Check if RegisterRequestDTO has password field
         Check if setPassword() is being called
```

### **Issue 2: Password Not Encrypted**

```
Problem: password stored as plain text
Solution: Check if passwordEncoder.encode() is being called
         Verify BCryptPasswordEncoder bean is configured
```

### **Issue 3: isVerified Still False**

```
Problem: Email verified but isVerified = false
Solution: Check EmailVerificationService.verifyEmail()
         Verify user.setVerified(true) is being called
         Check if userRepository.save() is being called
```

### **Issue 4: Wrong Email**

```
Problem: User entering different email during login
Solution: Double-check email spelling
         Check for spaces or special characters
```

---

## **📋 FILES MODIFIED:**

```
✅ src/main/java/com/bihar/seva/service/AuthService.java
   - Added debug logging for password encoding
   - Added debug logging for password matching

✅ src/main/java/com/bihar/seva/controller/DebugController.java (NEW)
   - Debug endpoint to check user details
   - Shows password hash, verification status
```

---

## **🎯 NEXT STEPS:**

```
1. ✅ Restart backend with new logging
2. ✅ Register fresh user
3. ✅ Check backend logs for password encoding
4. ✅ Verify email
5. ✅ Use debug endpoint to check user
6. ✅ Try login
7. ✅ Check logs for password matching
8. ✅ Share logs if still failing
```

---

## **🔍 WHAT TO SHARE IF STILL FAILING:**

```
1. Backend logs during registration
2. Backend logs during login
3. Response from debug endpoint
4. MongoDB user document
5. Exact email & password used
```

---

**🎊 AB TEST KARO AUR LOGS SHARE KARO!**

