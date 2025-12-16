# MSG91 SMS Integration Guide - BiharSeva

## 📋 Overview
Yeh guide aapko MSG91 SMS gateway integrate karne mein help karega, jisse aap real SMS OTP bhej sakte hain.

---

## 🚀 Step 1: MSG91 Account Setup

### 1.1 Account Creation
1. **Website visit karein:** https://control.msg91.com/
2. **Sign Up** button par click karein
3. Apna email, phone number, aur company details fill karein
4. Email verification complete karein

### 1.2 Account Verification
- Phone number verify karein (OTP aayega)
- Email verify karein
- Company details submit karein (agar required ho)

---

## 🔑 Step 2: API Key Generate Karein

### 2.1 Dashboard se API Key
1. Login ke baad **Dashboard** par jayein
2. Left sidebar mein **"API"** ya **"API Settings"** option dikhega
3. **"Get API Key"** ya **"Generate API Key"** par click karein
4. API Key copy kar lein (yeh ek long string hoga)

**Example API Key format:**
```
1234567890abcdefghijklmnopqrstuvwxyzABCDEF
```

### 2.2 API Key Types
- **Transaction SMS:** Normal OTP aur transactional messages ke liye (recommended)
- **Promotional SMS:** Marketing messages ke liye

**Note:** OTP ke liye Transaction SMS use karein.

---

## 📱 Step 3: Sender ID Setup

### 3.1 Sender ID Request
1. Dashboard mein **"Sender ID"** section mein jayein
2. **"Request New Sender ID"** par click karein
3. Apna desired Sender ID enter karein (6 characters max)
   - Example: `BHRSVA`, `BIHSEV`, `BSEVA`
4. Purpose select karein: **"OTP/Transactional"**
5. Submit karein

### 3.2 Sender ID Approval
- MSG91 team 24-48 hours mein approve karti hai
- Approval ke baad aapko email aayega
- Approved Sender ID ko note kar lein

**Note:** Approval tak, MSG91 default sender ID use kar sakte hain (usually `MSGIND`)

---

## ⚙️ Step 4: Application Configuration

### 4.1 application.properties Update
`src/main/resources/application.properties` file mein yeh values update karein:

```properties
# SMS Configuration
sms.enabled=true
sms.provider=msg91

# MSG91 Configuration
# Apna actual API key yahan paste karein
sms.msg91.authkey=YOUR_MSG91_AUTH_KEY_HERE

# Approved Sender ID (6 characters max)
sms.msg91.sender=BHRSVA

# Route: 4 for Transactional SMS (recommended for OTP)
sms.msg91.route=4
```

### 4.2 Configuration Values Explained

| Property | Value | Description |
|---------|-------|-------------|
| `sms.enabled` | `true` | SMS service enable karega |
| `sms.provider` | `msg91` | MSG91 provider use karega |
| `sms.msg91.authkey` | Your API Key | MSG91 se mila API key |
| `sms.msg91.sender` | Your Sender ID | Approved sender ID (6 chars max) |
| `sms.msg91.route` | `4` | Transactional SMS route |

---

## 🧪 Step 5: Testing

### 5.1 Backend Restart
```bash
# Backend restart karein
mvn spring-boot:run
```

### 5.2 Test SMS Send
1. **Profile Page** par jayein
2. **"Edit Phone"** button click karein
3. Aadhaar number enter karein
4. **"Send OTP"** click karein
5. SMS aana chahiye apne registered mobile number par

### 5.3 Logs Check Karein
Backend logs mein yeh dikhega:
```
📱 ========================================
📱 SMS TO: +91XXXXXXXXXX
📱 MESSAGE: Your BiharSeva OTP for Aadhaar Verification is 123456...
📱 ========================================
📤 Sending SMS via MSG91 to: XXXXXXXXXX
📥 MSG91 Response: 1234567890 (Message ID)
✅ SMS sent successfully via MSG91
```

**Note:** MSG91 response mein ek message ID aayega (number format). Agar error aaye to error message dikhega.

---

## 🔍 Troubleshooting

### Problem 1: SMS nahi aa raha
**Solutions:**
- ✅ API key sahi hai ya nahi check karein
- ✅ Sender ID approved hai ya nahi verify karein
- ✅ Phone number format sahi hai (10 digits without +91)
- ✅ Backend logs check karein for error messages
- ✅ MSG91 dashboard mein SMS delivery status check karein

### Problem 2: "Invalid Auth Key" Error
**Solution:**
- API key copy-paste mein space ya extra character na ho
- API key expire nahi hua ho
- MSG91 dashboard se fresh API key generate karein

### Problem 3: "Invalid Sender ID" Error
**Solution:**
- Sender ID exactly 6 characters hona chahiye
- Sender ID approved hona chahiye
- Temporary ke liye `MSGIND` use kar sakte hain (MSG91 default)

### Problem 4: SMS Delivery Failed
**Solutions:**
- ✅ MSG91 account mein sufficient balance ho
- ✅ Phone number valid Indian number ho (10 digits)
- ✅ DND (Do Not Disturb) list mein number na ho
- ✅ MSG91 dashboard mein delivery reports check karein

---

## 💰 Pricing Information

### MSG91 Pricing (Approximate)
- **Transaction SMS:** ₹0.15 - ₹0.25 per SMS
- **Promotional SMS:** ₹0.10 - ₹0.20 per SMS
- **Minimum Recharge:** Usually ₹500 - ₹1000

**Note:** Pricing MSG91 website par check karein - yeh change ho sakta hai.

---

## 📊 MSG91 Dashboard Features

### Useful Sections:
1. **SMS Reports:** Delivery status, failed SMS, etc.
2. **Balance:** Account balance check
3. **API Logs:** API calls history
4. **Sender IDs:** Manage sender IDs
5. **Templates:** SMS templates (DLT registration ke liye)

---

## 🔐 Security Best Practices

1. ✅ **API Key ko secure rakhein**
   - `.gitignore` mein `application.properties` add karein (agar sensitive data ho)
   - Production mein environment variables use karein

2. ✅ **Rate Limiting**
   - MSG91 automatically rate limit karta hai
   - Zyada requests se account temporarily block ho sakta hai

3. ✅ **Error Handling**
   - SMS fail hone par fallback mechanism rakhein
   - Logs maintain karein for debugging

---

## 🆘 Support

### MSG91 Support:
- **Email:** support@msg91.com
- **Phone:** +91-XXXXXXXXXX (check website)
- **Live Chat:** MSG91 dashboard mein available

### Common Issues:
1. **Account Verification:** Email/Phone verify karein
2. **API Key Expiry:** Fresh API key generate karein
3. **Balance Low:** Recharge karein
4. **Sender ID Pending:** Wait karein ya MSG91 se contact karein

---

## ✅ Checklist

Setup complete hone ke baad yeh verify karein:

- [ ] MSG91 account created aur verified
- [ ] API key generated aur copied
- [ ] Sender ID requested (ya approved)
- [ ] `application.properties` updated with correct values
- [ ] Backend restarted
- [ ] Test SMS sent successfully
- [ ] SMS received on mobile
- [ ] Logs check kiye (no errors)

---

## 📝 Alternative SMS Providers

Agar MSG91 use nahi karna chahte, to yeh alternatives hain:

### 1. **TextLocal**
- Website: https://www.textlocal.in/
- Similar API structure
- Good for Indian market

### 2. **Twilio**
- Website: https://www.twilio.com/
- International support
- More expensive but reliable

### 3. **AWS SNS**
- Website: https://aws.amazon.com/sns/
- Good for cloud-based apps
- Pay-as-you-go pricing

**Note:** Agar koi aur provider use karna ho, to `SMSService.java` mein changes karne padenge.

---

## 🎯 Next Steps

1. ✅ MSG91 account setup complete karein
2. ✅ API key aur Sender ID configure karein
3. ✅ Test SMS bhej kar verify karein
4. ✅ Production deploy se pehle thorough testing karein
5. ✅ Monitoring setup karein (SMS delivery reports)

---

## 📞 Help

Agar koi problem aaye to:
1. Backend logs check karein
2. MSG91 dashboard check karein
3. Error messages note karein
4. Support team se contact karein

**Happy Coding! 🚀**

