# 📋 Backend Logs Kaise Share Karein

## 🔍 Logs Kahan Se Milenge?

### Option 1: Backend Console/Terminal (Easiest) ⭐

**Steps:**
1. Backend jis terminal mein run ho raha hai, wahan jayein
2. Terminal scroll karein (up arrow ya mouse se)
3. Jab aapne Aadhaar OTP send kiya tha, us time ke logs dekhein
4. Logs copy karein (select karke Ctrl+C)

**Example Terminal:**
```
C:\personal\BiharSeva> mvn spring-boot:run
...
2025-11-29 04:30:15.123 [main] INFO  com.bihar.seva.service.SMSService - 📞 sendOTP called
2025-11-29 04:30:15.124 [main] INFO  com.bihar.seva.service.SMSService - 📞 Phone: 9263565755
...
```

---

### Option 2: Log File Se

**File Location:** `C:\personal\BiharSeva\logs\bihar-seva.log`

**Steps:**
1. File explorer mein jayein: `C:\personal\BiharSeva\logs\`
2. `bihar-seva.log` file open karein (Notepad ya text editor se)
3. File ke end mein latest logs honge
4. Relevant logs copy karein

**Note:** Agar file nahi dikh rahi, to `logs` folder create karein.

---

### Option 3: IDE Console Se

**Steps:**
1. Agar IDE (IntelliJ, Eclipse, VS Code) se run kar rahe ho
2. IDE mein "Console" ya "Output" tab open karein
3. Latest logs dekhein
4. Logs select karke copy karein

---

## 📤 Kya Logs Share Karein?

### Important Logs (Copy Karein):

Jab aapne Aadhaar OTP send kiya, us time ke yeh logs:

```
📞 ========================================
📞 sendOTP called
📞 Phone: 9263565755
📞 OTP: 123456
📞 Purpose: Aadhaar Verification
📞 SMS Enabled: true
📞 SMS Provider: msg91
📞 ========================================
📤 Using MSG91 OTP API
🔵 sendOTPViaMSG91 called
📤 Sending OTP via MSG91 OTP API to: 919263565755
📋 MSG91 OTP API Request URL: https://api.msg91.com/api/v5/otp
📋 MSG91 OTP API Request Body: {mobile=919263565755, otp=123456, message=...}
📥 MSG91 OTP API Response Status: 200 OK
📥 MSG91 OTP API Response Body: {...}
✅ OTP sent successfully via MSG91 OTP API
```

Ya agar error ho to:
```
❌ MSG91 OTP API Error: Invalid auth key
❌ MSG91 OTP API Error: Insufficient balance
❌ HTTP Error sending OTP via MSG91 OTP API: 400
```

---

## 🎯 Quick Steps

1. ✅ **Backend terminal/console open karein**
2. ✅ **Aadhaar OTP send karein** (frontend se ya test endpoint se)
3. ✅ **Terminal mein latest logs dekhein**
4. ✅ **Logs select karke copy karein** (Ctrl+C)
5. ✅ **Yahan paste karein** (Ctrl+V)

---

## 💡 Tips

- **Latest logs:** Terminal ke end mein latest logs honge
- **Search:** Terminal mein `📞 sendOTP` search karein (Ctrl+F)
- **Scroll:** Terminal scroll karein to purane logs bhi dikhenge

---

## 📝 Example Format

Agar logs share karein, to yeh format mein:

```
[Latest logs from terminal]
📞 sendOTP called
📞 Phone: 9263565755
📞 SMS Enabled: true
📞 SMS Provider: msg91
📤 Using MSG91 OTP API
📥 MSG91 OTP API Response: {...}
```

---

**Backend terminal se logs copy karke yahan paste karein! 📋**

