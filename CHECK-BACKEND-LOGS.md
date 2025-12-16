# 🔍 Backend Logs Check Karne Ka Guide

## 📋 Frontend Response
Aapko frontend se success response mila hai:
```json
{
  "success": true,
  "message": "OTP sent to registered mobile number",
  "data": {"otpSent": true}
}
```

**Matlab:** Backend ne OTP generate kar diya hai, ab SMS service check karni hai.

---

## 🔍 Backend Logs Kahan Check Karein?

### Option 1: Console/Terminal (Easiest)
Backend jis terminal mein run ho raha hai, wahan logs dikhenge.

### Option 2: Log File
File location: `logs/bihar-seva.log`

### Option 3: IDE Console
Agar IDE se run kar rahe ho, to console mein logs dikhenge.

---

## 📊 Expected Logs (Success Case)

Agar sab sahi hai, to yeh logs dikhne chahiye:

```
📞 ========================================
📞 sendOTP called
📞 Phone: 9876543210
📞 OTP: 123456
📞 Purpose: Aadhaar Verification
📞 SMS Enabled: true
📞 SMS Provider: msg91
📞 ========================================
📤 Using MSG91 OTP API
🔵 ========================================
🔵 sendOTPViaMSG91 called
🔵 Phone: 9876543210
🔵 OTP: 123456
🔵 Auth Key configured: true
🔵 ========================================
📤 Sending OTP via MSG91 OTP API to: 919876543210
🔑 OTP: 123456
📋 MSG91 OTP API Request URL: https://api.msg91.com/api/v5/otp
📋 MSG91 OTP API Request Body: {mobile=919876543210, otp=123456, message=...}
📥 MSG91 OTP API Response Status: 200 OK
📥 MSG91 OTP API Response Body: {type=success, message=OTP sent successfully}
✅ OTP sent successfully via MSG91 OTP API
✅ OTP sent successfully via SMS to 9876543210
```

---

## ❌ Error Logs (Check for these)

### Error 1: SMS Not Enabled
```
📞 SMS Enabled: false
📞 SMS Provider: none
📤 Using Development Mode (SMS logging only)
```
**Fix:** `application.properties` mein `sms.enabled=true` set karein.

### Error 2: Auth Key Not Configured
```
❌ MSG91 Auth Key not configured!
💡 Add sms.msg91.authkey=YOUR_AUTH_KEY in application.properties
```
**Fix:** Auth key check karein `application.properties` mein.

### Error 3: MSG91 API Error
```
❌ MSG91 OTP API Error: Invalid auth key
```
Ya
```
❌ MSG91 OTP API Error: Insufficient balance
```
Ya
```
❌ MSG91 OTP API Error: Sender ID not approved
```

**Fix:** MSG91 dashboard check karein.

### Error 4: Exception
```
❌ Error sending SMS, but OTP generated: 123456
SMS Error: [error message]
```
**Fix:** Exception details check karein.

---

## 🎯 Quick Checklist

Backend logs mein yeh check karein:

- [ ] `📞 sendOTP called` - SMS service call hua ya nahi?
- [ ] `📞 SMS Enabled: true` - SMS enabled hai ya nahi?
- [ ] `📞 SMS Provider: msg91` - Provider sahi hai ya nahi?
- [ ] `📤 Using MSG91 OTP API` - MSG91 API use ho rahi hai ya nahi?
- [ ] `🔵 Auth Key configured: true` - Auth key sahi hai ya nahi?
- [ ] `📥 MSG91 OTP API Response` - Response kya aaya?
- [ ] `✅ OTP sent successfully` - Success message hai ya error?

---

## 📤 Backend Logs Share Karein

Agar issue ho, to backend logs ka yeh part share karein:

1. `📞 sendOTP called` se start hone wale logs
2. `📤 Using MSG91 OTP API` ya `📤 Using Development Mode` wale logs
3. `📥 MSG91 OTP API Response` wale logs
4. Koi error message ho to woh bhi

**Example:**
```
📞 sendOTP called
📞 Phone: 9876543210
📞 SMS Enabled: true
📞 SMS Provider: msg91
📤 Using MSG91 OTP API
❌ MSG91 OTP API Error: Invalid auth key
```

---

## 💡 Common Issues

### Issue 1: Backend Restart Nahi Kiya
**Symptom:** Logs mein `SMS Enabled: false` dikhega
**Fix:** Backend restart karein

### Issue 2: Configuration Not Loaded
**Symptom:** Old configuration values dikhenge
**Fix:** Backend restart karein

### Issue 3: SMS Service Not Called
**Symptom:** `📞 sendOTP called` logs nahi dikhenge
**Fix:** `UserService.java` mein SMS service call check karein

---

**Backend logs share karein taaki exact issue identify kar saken! 🔍**

