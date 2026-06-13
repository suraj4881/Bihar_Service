package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email-verification")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationController {
    
    private final EmailVerificationService emailVerificationService;
    
    /**
     * Verify email with code
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyEmail(
            @RequestParam String email,
            @RequestParam String code) {
        try {
            log.info("📧 Verifying email: {}", email);
            
            boolean verified = emailVerificationService.verifyEmail(email, code);
            
            if (verified) {
                Map<String, Object> response = new HashMap<>();
                response.put("email", email);
                response.put("verified", true);
                
                log.info("✅ Email verified successfully: {}", email);
                return ResponseEntity.ok(new ApiResponse<>(true, "Email verified successfully", response));
            } else {
                log.warn("❌ Invalid verification code for: {}", email);
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid verification code", null));
            }
            
        } catch (Exception e) {
            log.error("❌ Error verifying email: {}", email, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Verification failed: " + e.getMessage(), null));
        }
    }
    
    /**
     * Resend verification email
     */
    @PostMapping("/resend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendVerificationEmail(
            @RequestParam String email) {
        try {
            log.info("🔄 Resending verification email to: {}", email);
            
            emailVerificationService.resendVerificationEmail(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("message", "Verification email sent");
            
            log.info("✅ Verification email resent to: {}", email);
            return ResponseEntity.ok(new ApiResponse<>(true, "Verification email sent", response));
            
        } catch (Exception e) {
            log.error("❌ Error resending verification email: {}", email, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to send email: " + e.getMessage(), null));
        }
    }
}

