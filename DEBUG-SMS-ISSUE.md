# 🔍 SMS Not Received - Debugging Guide

## ✅ Current Configuration
- **SMS Enabled:** `true`
- **Provider:** `msg91`
- **Auth Key:** Configured ✅
- **Sender ID:** `BHRSVA`

---

## 🔍 Step 1: Check Backend Logs

Backend console ya log file (`logs/bihar-seva.log`) mein yeh check karein:

### Expected Success Logs:
```
📤 Sending OTP via MSG91 OTP API to: 91XXXXXXXXXX
🔑 OTP: 123456
📋 MSG91 OTP API Request URL: https://api.msg91.com/api/v5/otp
📋 MSG91 OTP API Request Body: {mobile=91XXXXXXXXXX, otp=123456, message=...}
📥 MSG91 OTP API Response Status: 200 OK
📥 MSG91 OTP API Response Body: {type=success, message=OTP sent successfully}
✅ OTP sent successfully via MSG91 OTP API
```

### Error Logs (Check for these):
```
❌ MSG91 OTP API Error: Invalid auth key
❌ MSG91 OTP API Error: Invalid mobile number
❌ MSG91 OTP API Error: Insufficient balance
❌ MSG91 OTP API Error: Sender ID not approved
```

---

## 🔍 Step 2: Check MSG91 Dashboard

1. **Login:** https://control.msg91.com/
2. **SMS Reports** section mein jayein
3. Check karein:
   - ✅ SMS sent hua ya nahi?
   - ✅ Delivery status kya hai?
   - ✅ Koi error message hai?

### Common Status:
- **Sent:** SMS MSG91 tak pahunch gaya
- **Delivered:** SMS mobile tak pahunch gaya ✅
- **Failed:** SMS fail ho gaya (reason check karein)
- **Pending:** Abhi process ho raha hai

---

## 🔍 Step 3: Common Issues & Solutions

### Issue 1: "Invalid Auth Key"
**Symptoms:**
- Logs mein: `❌ MSG91 OTP API Error: Invalid auth key`

**Solutions:**
- ✅ Auth key correctly copied hai ya nahi verify karein
- ✅ No extra spaces/quotes
- ✅ MSG91 dashboard se fresh API key generate karein
- ✅ API key active hai ya nahi check karein

### Issue 2: "Invalid Mobile Number"
**Symptoms:**
- Logs mein: `❌ MSG91 OTP API Error: Invalid mobile number`

**Solutions:**
- ✅ Phone number 10 digits ka hai ya nahi
- ✅ Country code nahi lagana (91 automatically add ho jayega)
- ✅ No spaces/dashes in phone number

### Issue 3: "Insufficient Balance"
**Symptoms:**
- Logs mein: `❌ MSG91 OTP API Error: Insufficient balance`
- MSG91 dashboard mein balance zero dikhega

**Solutions:**
- ✅ MSG91 account recharge karein (minimum ₹500)
- ✅ Balance check karein dashboard se

### Issue 4: "Sender ID Not Approved"
**Symptoms:**
- Logs mein: `❌ MSG91 OTP API Error: Sender ID not approved`

**Solutions:**
- ✅ Temporary ke liye `MSGIND` use karein (MSG91 default)
- ✅ `application.properties` mein:
  ```properties
  sms.msg91.sender=MSGIND
  ```
- ✅ Ya apna Sender ID approve hone ka wait karein

### Issue 5: SMS Sent But Not Delivered
**Symptoms:**
- Backend logs: `✅ OTP sent successfully`
- MSG91 dashboard: Status "Sent" but not "Delivered"
- Mobile pe SMS nahi aaya

**Solutions:**
- ✅ Phone number sahi hai ya nahi verify karein
- ✅ DND (Do Not Disturb) list mein number na ho
- ✅ Network issue ho sakta hai - thoda wait karein
- ✅ MSG91 support se contact karein

### Issue 6: Backend Restart Nahi Kiya
**Symptoms:**
- Configuration update kiye but changes apply nahi huye

**Solutions:**
- ✅ **Backend restart karein** (Important!)
- ✅ `mvn spring-boot:run` ya IDE se restart
- ✅ Configuration reload verify karein

---

## 🔍 Step 4: Test API Directly

Agar backend logs se issue clear nahi ho raha, to MSG91 API ko directly test karein:

### Using cURL:
```bash
curl -X POST "https://api.msg91.com/api/v5/otp" \
  -H "Content-Type: application/json" \
  -H "authkey: 475193A3M20bzeR692a2392P1" \
  -d '{
    "mobile": "91XXXXXXXXXX",
    "otp": "123456",
    "message": "Your BiharSeva OTP is 123456. Valid for 5 minutes."
  }'
```

### Using Postman:
1. **Method:** POST
2. **URL:** `https://api.msg91.com/api/v5/otp`
3. **Headers:**
   - `Content-Type: application/json`
   - `authkey: 475193A3M20bzeR692a2392P1`
4. **Body (JSON):**
   ```json
   {
     "mobile": "91XXXXXXXXXX",
     "otp": "123456",
     "message": "Your BiharSeva OTP is 123456. Valid for 5 minutes."
   }
   ```

---

## 🔍 Step 5: Check Application Properties

Verify karein ki `application.properties` mein sab sahi hai:

```properties
sms.enabled=true
sms.provider=msg91
sms.msg91.authkey=475193A3M20bzeR692a2392P1
sms.msg91.sender=BHRSVA
sms.msg91.route=4
```

**Important:**
- ✅ No spaces around `=`
- ✅ No quotes around values
- ✅ Backend restart kiya hai

---

## 📞 Next Steps

1. ✅ **Backend logs check karein** - exact error message note karein
2. ✅ **MSG91 dashboard check karein** - SMS reports dekhein
3. ✅ **Account balance check karein** - recharge karein agar zero ho
4. ✅ **Sender ID check karein** - `MSGIND` use karein agar approved nahi hai
5. ✅ **Backend restart karein** - configuration changes apply karein

---

## 💡 Quick Fixes

### Fix 1: Use Default Sender ID
```properties
sms.msg91.sender=MSGIND
```
Backend restart karein.

### Fix 2: Enable Development Mode (Testing)
```properties
sms.enabled=false
sms.provider=none
```
Backend logs mein OTP dikhega testing ke liye.

### Fix 3: Check Phone Number Format
- ✅ 10 digits only (no country code)
- ✅ No spaces/dashes
- ✅ Example: `9876543210` ✅ (not `+919876543210` ❌)

---

**Agar abhi bhi issue ho, to backend logs share karein! 🔍**

