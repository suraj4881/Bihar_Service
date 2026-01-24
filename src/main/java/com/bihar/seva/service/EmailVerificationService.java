package com.bihar.seva.service;

import com.bihar.seva.model.User;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {
    
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    /**
     * Generate 6-digit verification code
     */
    public String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }
    
    /**
     * Send verification email to user
     */
    public void sendVerificationEmail(User user) {
        try {
            String verificationCode = generateVerificationCode();
            
            // Save verification code to user
            user.setVerificationCode(verificationCode);
            user.setVerified(false);
            userRepository.save(user);
            
            // Send email
            String subject = "Verify Your QuickSeva Bihar Account";
            String body = buildVerificationEmailBody(user.getName(), verificationCode);
            
            emailService.sendHtmlEmail(user.getEmail(), subject, body);
            
            log.info("✅ Verification email sent to: {}", user.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Failed to send verification email to: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send verification email");
        }
    }
    
    /**
     * Verify email with code
     */
    public boolean verifyEmail(String email, String code) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                log.warn("⚠️ User not found for email: {}", email);
                return false;
            }
            
            User user = userOpt.get();
            
            // Check if already verified
            if (user.isVerified()) {
                log.info("ℹ️ User already verified: {}", email);
                return true;
            }
            
            // Check verification code
            if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
                log.warn("❌ Invalid verification code for: {}", email);
                return false;
            }
            
            // Verify user
            user.setVerified(true);
            user.setVerificationCode(null); // Clear code after verification
            userRepository.save(user);
            
            log.info("✅ Email verified successfully for: {}", email);
            return true;
            
        } catch (Exception e) {
            log.error("❌ Error verifying email: {}", email, e);
            return false;
        }
    }
    
    /**
     * Resend verification email
     */
    public void resendVerificationEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (user.isVerified()) {
            throw new RuntimeException("Email already verified");
        }
        
        sendVerificationEmail(user);
    }
    
    /**
     * Build HTML email body for verification
     */
    private String buildVerificationEmailBody(String userName, String code) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                ".header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
                ".content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
                ".code-box { background: white; border: 2px dashed #FF6B35; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }" +
                ".code { font-size: 32px; font-weight: bold; color: #FF6B35; letter-spacing: 5px; }" +
                ".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h1>🎉 Welcome to QuickSeva Bihar!</h1>" +
                "</div>" +
                "<div class='content'>" +
                "<p>Hello <strong>" + userName + "</strong>,</p>" +
                "<p>Thank you for registering with QuickSeva Bihar! Please verify your email address to complete your registration.</p>" +
                "<p><strong>Your verification code is:</strong></p>" +
                "<div class='code-box'>" +
                "<div class='code'>" + code + "</div>" +
                "</div>" +
                "<p>Enter this code on the verification page to activate your account.</p>" +
                "<p><strong>⏰ This code will expire in 10 minutes.</strong></p>" +
                "<p>If you didn't create an account with QuickSeva Bihar, please ignore this email.</p>" +
                "<div class='footer'>" +
                "<p>© 2024 QuickSeva Bihar - Service Marketplace</p>" +
                "<p>This is an automated email. Please do not reply.</p>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}

