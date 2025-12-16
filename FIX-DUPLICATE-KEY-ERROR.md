# 🔧 Fix MongoDB Duplicate Key Error

## ❌ **Error:**
```
E11000 duplicate key error collection: bihar_seva.users index: phone dup key: { phone: null }
```

## 🎯 **Root Cause:**
- User model has `phone` field with unique index
- Email OTP users don't have phone (null)
- MongoDB doesn't allow multiple null values in unique index

## ✅ **Solution:**

### **Step 1: Update User Model** ✅ DONE
Changed phone index to `sparse = true`:
```java
@Indexed(unique = true, sparse = true) // Allows multiple null values
private String phone;
```

### **Step 2: Drop Old Index in MongoDB**

**Open MongoDB Shell:**
```bash
mongosh
```

**Run these commands:**
```javascript
// Switch to bihar_seva database
use bihar_seva

// Check existing indexes
db.users.getIndexes()

// Drop the old phone index
db.users.dropIndex("phone_1")

// Verify it's dropped
db.users.getIndexes()

// Exit
exit
```

### **Step 3: Restart Backend**

Backend will auto-create new sparse index on startup.

```bash
# In backend terminal
Ctrl + C  (stop)
mvn spring-boot:run  (restart)
```

---

## 🎯 **Complete Fix Steps:**

### **1. MongoDB Commands:**
```bash
mongosh
use bihar_seva
db.users.dropIndex("phone_1")
exit
```

### **2. Restart Backend:**
```bash
# Stop: Ctrl + C
# Start: mvn spring-boot:run
```

### **3. Test Again:**
```
http://localhost:3000/email-otp
Email: yourtest@gmail.com
Send OTP → Get OTP from console
Verify → ✅ Should work now!
```

---

## 📝 **What Changed:**

### **Before:**
```java
@Indexed(unique = true)  // ❌ Doesn't allow multiple nulls
private String phone;
```

### **After:**
```java
@Indexed(unique = true, sparse = true)  // ✅ Allows multiple nulls
private String phone;
```

**Sparse index:** Only indexes documents where the field exists and is not null.

---

## 🎊 **After Fix:**

- ✅ Email-only users can register (phone = null)
- ✅ Phone-only users can register (email may be null)
- ✅ Users with both can register
- ✅ No duplicate key error

---

## 🚀 **Quick Fix Command:**

```bash
# One-liner to fix:
mongosh --eval "use bihar_seva; db.users.dropIndex('phone_1')"
```

Then restart backend!

---

**Ab MongoDB mein jao aur index drop karo!** 🔧

