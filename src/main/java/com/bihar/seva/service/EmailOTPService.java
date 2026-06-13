package com.bihar.seva.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailOTPService {
    
    private final EmailService emailService;
    
    // In-memory OTP storage (for development)
    // In production, use Redis or database
    private final Map<String, OTPData> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();
    
    /**
     * Generate 6-digit OTP
     */
    public String generateOTP() {
        return String.format("%06d", random.nextInt(1000000));
    }
    
    /**
     * Send OTP to email
     */
    public String sendOTP(String email) {
        try {
            // Generate OTP
            String otp = generateOTP();
            
            // Store OTP with expiry time (5 minutes)
            OTPData otpData = new OTPData(otp, LocalDateTime.now().plusMinutes(5));
            otpStorage.put(email, otpData);
            
            log.info("✅ OTP generated for {}: {}", email, otp);
            
            // Send real email
            try {
                emailService.sendOTPEmail(email, otp);
                log.info("📧 OTP email sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("❌ Failed to send email, but OTP generated: {}", otp);
                // Continue even if email fails (for testing)
            }
            
            // Don't return OTP in production for security
            return null; // Return null instead of OTP
        } catch (Exception e) {
            log.error("Error sending OTP to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send OTP: " + e.getMessage());
        }
    }
    
    /**
     * Verify OTP
     */
    public boolean verifyOTP(String email, String otp) {
        try {
            OTPData storedData = otpStorage.get(email);
            
            if (storedData == null) {
                log.warn("No OTP found for email: {}", email);
                return false;
            }
            
            // Check if OTP expired
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                log.warn("OTP expired for email: {}", email);
                otpStorage.remove(email);
                return false;
            }
            
            // Verify OTP
            boolean isValid = storedData.getOtp().equals(otp);
            
            if (isValid) {
                log.info("✅ OTP verified successfully for: {}", email);
                otpStorage.remove(email); // Remove after successful verification
            } else {
                log.warn("❌ Invalid OTP for email: {}", email);
            }
            
            return isValid;
        } catch (Exception e) {
            log.error("Error verifying OTP for {}: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if OTP exists and is valid
     */
    public boolean isOTPValid(String email) {
        OTPData storedData = otpStorage.get(email);
        if (storedData == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(storedData.getExpiryTime());
    }
    
    /**
     * Resend OTP
     */
    public String resendOTP(String email) {
        otpStorage.remove(email); // Remove old OTP
        return sendOTP(email);
    }
    
    /**
     * Inner class to store OTP data
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class OTPData {
        private String otp;
        private LocalDateTime expiryTime;
    }
}

