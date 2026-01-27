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
            // Normalize email to lowercase for consistent storage
            String normalizedEmail = email.toLowerCase().trim();
            
            // Generate OTP
            String otp = generateOTP();
            
            // Store OTP with expiry time (10 minutes for password reset)
            OTPData otpData = new OTPData(otp, LocalDateTime.now().plusMinutes(10));
            otpStorage.put(normalizedEmail, otpData);
            
            log.info("✅ OTP generated for {}: {}", normalizedEmail, otp);
            log.info("📧 Stored OTP in map with key: {}", normalizedEmail);
            
            // Send real email
            try {
                emailService.sendOTPEmail(email, otp);
                log.info("📧 OTP email sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("❌ Failed to send email, but OTP generated: {}", otp);
                log.error("❌ Email error details: {}", e.getMessage());
                e.printStackTrace();
                // Continue even if email fails (for testing)
            }
            
            // Return OTP for development/testing (remove in production)
            return otp;
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
            // Normalize email to lowercase for consistent lookup
            String normalizedEmail = email.toLowerCase().trim();
            String trimmedOtp = otp != null ? otp.trim() : "";
            
            log.info("🔍 Verifying OTP for email: {} (normalized: {})", email, normalizedEmail);
            log.info("🔍 OTP received: {} (length: {})", trimmedOtp, trimmedOtp.length());
            log.info("🔍 OTP storage keys: {}", otpStorage.keySet());
            
            OTPData storedData = otpStorage.get(normalizedEmail);
            
            if (storedData == null) {
                log.warn("❌ No OTP found for email: {} (normalized: {})", email, normalizedEmail);
                log.warn("❌ Available keys in storage: {}", otpStorage.keySet());
                return false;
            }
            
            log.info("📧 Found stored OTP data for: {}", normalizedEmail);
            log.info("📧 Stored OTP: {} (length: {})", storedData.getOtp(), storedData.getOtp().length());
            log.info("📧 OTP expires at: {}", storedData.getExpiryTime());
            
            // Check if OTP expired
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                log.warn("❌ OTP expired for email: {} (expired at: {})", normalizedEmail, storedData.getExpiryTime());
                otpStorage.remove(normalizedEmail);
                return false;
            }
            
            // Verify OTP (trim both for comparison)
            boolean isValid = storedData.getOtp().trim().equals(trimmedOtp);
            
            if (isValid) {
                log.info("✅ OTP verified successfully for: {}", normalizedEmail);
                // Don't remove OTP here - keep it for password reset step
            } else {
                log.warn("❌ Invalid OTP for email: {}", normalizedEmail);
                log.warn("❌ Expected: '{}' (length: {}), Got: '{}' (length: {})", 
                    storedData.getOtp(), storedData.getOtp().length(), trimmedOtp, trimmedOtp.length());
            }
            
            return isValid;
        } catch (Exception e) {
            log.error("❌ Error verifying OTP for {}: {}", email, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Check if OTP exists and is valid (without removing it)
     */
    public boolean isOTPValid(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        OTPData storedData = otpStorage.get(normalizedEmail);
        if (storedData == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(storedData.getExpiryTime());
    }
    
    /**
     * Check if OTP matches without removing it (for password reset after verification)
     */
    public boolean checkOTPMatch(String email, String otp) {
        try {
            String normalizedEmail = email.toLowerCase().trim();
            String trimmedOtp = otp != null ? otp.trim() : "";
            
            OTPData storedData = otpStorage.get(normalizedEmail);
            
            if (storedData == null) {
                log.warn("❌ No OTP found for email: {}", normalizedEmail);
                return false;
            }
            
            // Check if OTP expired
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                log.warn("❌ OTP expired for email: {}", normalizedEmail);
                return false;
            }
            
            // Check if OTP matches (but don't remove it yet)
            boolean matches = storedData.getOtp().trim().equals(trimmedOtp);
            
            if (matches) {
                log.info("✅ OTP matches for email: {}", normalizedEmail);
            } else {
                log.warn("❌ OTP mismatch for email: {}", normalizedEmail);
            }
            
            return matches;
        } catch (Exception e) {
            log.error("❌ Error checking OTP match for {}: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * Resend OTP
     */
    public String resendOTP(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        otpStorage.remove(normalizedEmail); // Remove old OTP
        return sendOTP(email);
    }
    
    /**
     * Remove OTP (used after successful password reset)
     */
    public void removeOTP(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        otpStorage.remove(normalizedEmail);
        log.info("🗑️ OTP removed for email: {}", normalizedEmail);
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

