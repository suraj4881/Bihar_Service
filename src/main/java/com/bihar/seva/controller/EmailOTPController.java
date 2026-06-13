package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.User;
import com.bihar.seva.service.EmailOTPService;
import com.bihar.seva.service.UserService;
import com.bihar.seva.service.JWTService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/email-otp")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class EmailOTPController {
    
    private final EmailOTPService emailOTPService;
    private final UserService userService;
    private final JWTService jwtService;
    
    /**
     * Send OTP to email
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOTP(@RequestParam String email) {
        try {
            log.info("📧 Sending OTP to email: {}", email);
            
            // Check if email exists
            Optional<User> existingUser = userService.findByEmail(email);
            
            // Generate and send OTP
            String otp = emailOTPService.sendOTP(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("message", "OTP sent successfully");
            response.put("exists", existingUser.isPresent());
            // Remove otp from response in production
            // response.put("otp", otp); // For testing only!
            
            return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent to " + email, response));
            
        } catch (Exception e) {
            log.error("Error sending OTP: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to send OTP: " + e.getMessage(), null));
        }
    }
    
    /**
     * Verify OTP and login/register
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOTP(
            @RequestParam String email,
            @RequestParam String otp,
            @RequestParam(required = false) String name) {
        try {
            log.info("🔍 Verifying OTP for email: {}", email);
            
            // Verify OTP
            boolean isValid = emailOTPService.verifyOTP(email, otp);
            
            if (!isValid) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid or expired OTP", null));
            }
            
            log.info("✅ OTP verified successfully");
            
            // Check if user exists
            Optional<User> existingUser = userService.findByEmail(email);
            
            Map<String, Object> response = new HashMap<>();
            
            if (existingUser.isPresent()) {
                // Existing user - login
                User user = existingUser.get();
                String token = jwtService.generateToken(user.getEmail(), "CUSTOMER");
                
                // Check if user has password set
                boolean hasPassword = user.getPassword() != null 
                    && !user.getPassword().isEmpty() 
                    && !"email-otp-auth".equals(user.getPassword());
                
                response.put("user", user);
                response.put("token", token);
                response.put("role", "CUSTOMER");
                response.put("isNewUser", false);
                response.put("hasPassword", hasPassword);
                
                log.info("✅ Existing user logged in: {}, hasPassword: {}", email, hasPassword);
                return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
                
            } else {
                // New user - need registration
                if (name == null || name.trim().isEmpty()) {
                    response.put("email", email);
                    response.put("verified", true);
                    response.put("requiresRegistration", true);
                    
                    return ResponseEntity.ok(new ApiResponse<>(true, "Email verified. Complete registration.", response));
                }
                
                // Create new user
                User newUser = new User();
                newUser.setName(name);
                newUser.setEmail(email);
                newUser.setPassword("email-otp-auth"); // Temporary password marker
                newUser.setVerified(true);
                
                User savedUser = userService.saveUser(newUser);
                String token = jwtService.generateToken(savedUser.getEmail(), "CUSTOMER");
                
                response.put("user", savedUser);
                response.put("token", token);
                response.put("role", "CUSTOMER");
                response.put("isNewUser", true);
                response.put("hasPassword", false); // No real password set yet
                
                log.info("✅ New user created via OTP: {}, needs password setup", email);
                return ResponseEntity.ok(new ApiResponse<>(true, "Registration successful", response));
            }
            
        } catch (Exception e) {
            log.error("Error verifying OTP: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Verification failed: " + e.getMessage(), null));
        }
    }
    
    /**
     * Resend OTP
     */
    @PostMapping("/resend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendOTP(@RequestParam String email) {
        try {
            log.info("🔄 Resending OTP to email: {}", email);
            
            String otp = emailOTPService.resendOTP(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("message", "OTP resent successfully");
            // Remove otp from response in production
            // response.put("otp", otp); // For testing only!
            
            return ResponseEntity.ok(new ApiResponse<>(true, "OTP resent to " + email, response));
            
        } catch (Exception e) {
            log.error("Error resending OTP: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to resend OTP: " + e.getMessage(), null));
        }
    }
    
    /**
     * Check OTP status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkOTPStatus(@RequestParam String email) {
        try {
            boolean isValid = emailOTPService.isOTPValid(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("otpValid", isValid);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "OTP status retrieved", response));
            
        } catch (Exception e) {
            log.error("Error checking OTP status: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to check OTP status", null));
        }
    }
}

