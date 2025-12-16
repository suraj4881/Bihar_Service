# 🚀 MSG91 Quick Start Guide - BiharSeva

## ⚡ 5-Minute Setup

### Step 1: MSG91 Account
1. Visit: https://control.msg91.com/
2. Sign Up (Email + Phone verification)
3. Login

### Step 2: Get API Key
1. Dashboard → **API** section
2. Click **"Get API Key"** or **"Generate API Key"**
3. Copy the API key (long string)

### Step 3: Get Sender ID
1. Dashboard → **Sender ID** section
2. Request new Sender ID (e.g., `BHRSVA`)
3. Wait for approval (24-48 hours)
   - **OR** use default `MSGIND` for testing

### Step 4: Configure Backend
Open `src/main/resources/application.properties`:

```properties
# Enable SMS
sms.enabled=true
sms.provider=msg91

# Paste your MSG91 API key here
sms.msg91.authkey=PASTE_YOUR_API_KEY_HERE

# Your Sender ID (or MSGIND for testing)
sms.msg91.sender=BHRSVA

# Route 4 = Transactional SMS
sms.msg91.route=4
```

### Step 5: Restart Backend
```bash
mvn spring-boot:run
```

### Step 6: Test
1. Go to Profile Page
2. Click "Edit Phone"
3. Enter Aadhaar number
4. Click "Send OTP"
5. Check your mobile for SMS! 📱

---

## ✅ Success Indicators

### Backend Logs Should Show:
```
📤 Sending SMS via MSG91 to: 9876543210
📥 MSG91 Response: 1234567890
✅ SMS sent successfully via MSG91
```

### Mobile Should Receive:
```
Your BiharSeva OTP for Aadhaar Verification is 123456. Valid for 5 minutes. Do not share with anyone. - BiharSeva
```

---

## ❌ Common Errors & Fixes

### Error: "Invalid Auth Key"
- ✅ Check API key copied correctly (no spaces)
- ✅ Generate fresh API key from dashboard

### Error: "Invalid Sender ID"
- ✅ Use `MSGIND` for testing (MSG91 default)
- ✅ Wait for your Sender ID approval

### Error: SMS Not Received
- ✅ Check MSG91 dashboard → SMS Reports
- ✅ Verify phone number format (10 digits)
- ✅ Check account balance
- ✅ Check DND status

### Error: "Insufficient Balance"
- ✅ Recharge MSG91 account (minimum ₹500)

---

## 💡 Development Mode (Without MSG91)

Agar abhi MSG91 setup nahi kiya:

```properties
sms.enabled=false
sms.provider=none
```

Backend logs mein OTP dikhega:
```
📱 SMS TO: +91XXXXXXXXXX
📱 MESSAGE: Your BiharSeva OTP...
💡 Check backend logs for OTP in development mode
```

---

## 📞 Need Help?

1. **MSG91 Support:** support@msg91.com
2. **Check Logs:** Backend console mein errors dekhein
3. **MSG91 Dashboard:** SMS delivery reports check karein

---

## 🎯 Next Steps

- [ ] MSG91 account created
- [ ] API key copied
- [ ] Sender ID requested/approved
- [ ] application.properties updated
- [ ] Backend restarted
- [ ] Test SMS sent
- [ ] SMS received ✅

**Setup complete! 🎉**

