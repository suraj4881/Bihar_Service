package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.LoginRequestDTO;
import com.bihar.seva.dto.RegisterRequestDTO;
import com.bihar.seva.model.User;
import com.bihar.seva.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(@Valid @RequestBody RegisterRequestDTO requestDTO) {
        try {
            logger.info("Received registration request for email: {}, role: {}", 
                requestDTO.getEmail(), requestDTO.getRole());
            
            User user = authService.registerUser(requestDTO);
            
            logger.info("User registered successfully with ID: {}, role: {}", 
                user.getId(), user.getRole());
            
            return ResponseEntity.ok(ApiResponse.success(user, "User registered successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid registration request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error during user registration", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> loginUser(@Valid @RequestBody LoginRequestDTO requestDTO) {
        try {
            Map<String, Object> loginData = authService.loginUser(requestDTO);
            return ResponseEntity.ok(ApiResponse.success(loginData, "Login successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Boolean>> verifyEmail(@RequestParam String code) {
        try {
            boolean verified = authService.verifyEmail(code);
            return ResponseEntity.ok(ApiResponse.success(verified, "Email verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Boolean>> resendVerificationCode(@RequestParam String email) {
        try {
            boolean sent = authService.resendVerificationCode(email);
            return ResponseEntity.ok(ApiResponse.success(sent, "Verification code resent"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(@RequestParam String email) {
        try {
            Map<String, Object> response = authService.forgotPassword(email);
            return ResponseEntity.ok(ApiResponse.success(response, "Password reset OTP sent to email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify-password-reset-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyPasswordResetOTP(
            @RequestParam String email,
            @RequestParam String otp) {
        try {
            boolean verified = authService.verifyPasswordResetOTP(email, otp);
            return ResponseEntity.ok(ApiResponse.success(verified, "OTP verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reset-password-otp")
    public ResponseEntity<ApiResponse<Boolean>> resetPasswordWithOTP(
            @RequestParam String email,
            @RequestParam String otp,
            @RequestParam String password) {
        try {
            boolean reset = authService.resetPasswordWithOTP(email, otp, password);
            return ResponseEntity.ok(ApiResponse.success(reset, "Password reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Boolean>> resetPassword(@RequestParam String token, @RequestParam String password) {
        try {
            boolean reset = authService.resetPassword(token, password);
            return ResponseEntity.ok(ApiResponse.success(reset, "Password reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Boolean>> logout(@RequestParam String userId) {
        try {
            boolean success = authService.logoutUser(userId);
            return ResponseEntity.ok(ApiResponse.success(success, "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}