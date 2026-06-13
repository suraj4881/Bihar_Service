package com.bihar.seva.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SMS Service for sending OTP and notifications
 * 
 * Currently in development mode - logs SMS messages
 * In production, integrate with SMS gateway provider
 */
@Service
@Slf4j
public class SMSService {
    
    /**
     * Send SMS to phone number
     * 
     * @param phoneNumber Phone number (10 digits, without country code)
     * @param message SMS message content
     * @return true if SMS sent successfully
     */
    public boolean sendSMS(String phoneNumber, String message) {
        try {
            // Format phone number (add +91 for India)
            String formattedPhone = formatPhoneNumber(phoneNumber);
            
            log.info("📱 ========================================");
            log.info("📱 SMS TO: {}", formattedPhone);
            log.info("📱 MESSAGE: {}", message);
            log.info("📱 ========================================");
            log.info("✅ SMS logged (Development Mode)");
            log.info("💡 In production, integrate with SMS gateway provider");
            
            return true; // Return true for development
        } catch (Exception e) {
            log.error("❌ Error sending SMS to {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }
    
    /**
     * Send OTP via SMS
     * 
     * @param phoneNumber Phone number (10 digits)
     * @param otp 6-digit OTP code
     * @param purpose Purpose of OTP (e.g., "Aadhaar Verification", "Phone Change")
     * @return true if SMS sent successfully
     */
    public boolean sendOTP(String phoneNumber, String otp, String purpose) {
        log.info("📞 ========================================");
        log.info("📞 sendOTP called");
        log.info("📞 Phone: {}", phoneNumber);
        log.info("📞 OTP: {}", otp);
        log.info("📞 Purpose: {}", purpose);
        log.info("📞 ========================================");
        
        String message = String.format(
            "Your QuickSeva Bihar OTP for %s is %s. Valid for 5 minutes. Do not share with anyone. - QuickSeva Bihar",
            purpose,
            otp
        );
        return sendSMS(phoneNumber, message);
    }
    
    /**
     * Format phone number with country code
     * 
     * @param phoneNumber 10-digit phone number
     * @return Formatted phone number with +91 prefix
     */
    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return phoneNumber;
        }
        
        // Remove any spaces or dashes
        String cleaned = phoneNumber.replaceAll("[\\s-]", "");
        
        // Add +91 if not present
        if (cleaned.startsWith("+91")) {
            return cleaned;
        } else if (cleaned.startsWith("91") && cleaned.length() == 12) {
            return "+" + cleaned;
        } else if (cleaned.length() == 10) {
            return "+91" + cleaned;
        }
        
        return phoneNumber;
    }
}

