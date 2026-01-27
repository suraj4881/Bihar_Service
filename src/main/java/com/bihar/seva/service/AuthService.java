package com.bihar.seva.service;

import com.bihar.seva.dto.LoginRequestDTO;
import com.bihar.seva.dto.RegisterRequestDTO;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.util.LoggingUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailVerificationService emailVerificationService;
    
    @Autowired
    private EmailOTPService emailOTPService;
    
    /**
     * Register user - saves to User collection with role
     */
    public User registerUser(RegisterRequestDTO requestDTO) {
        LoggingUtil.logMethodEntry(logger, "registerUser", requestDTO.getEmail());
        
        try {
            logger.info("📥 Received registration request:");
            logger.info("   Name: {}", requestDTO.getName());
            logger.info("   Email: {}", requestDTO.getEmail());
            logger.info("   Phone: {}", requestDTO.getPhone());
            logger.info("   Role: {}", requestDTO.getRole());
            logger.info("   Language: {}", requestDTO.getLanguage());
            logger.info("   City: {}", requestDTO.getCity());
            
            String role = requestDTO.getRole();
            if (role == null || role.trim().isEmpty()) {
                logger.warn("⚠️ Role is null or empty, defaulting to CUSTOMER");
                role = "CUSTOMER";
            }
            
            // Check if user already exists
            if (userRepository.findByEmail(requestDTO.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            
            String encodedPassword = passwordEncoder.encode(requestDTO.getPassword());
            logger.info("🔐 Password encoded for user: {}", requestDTO.getEmail());
            
            String language = requestDTO.getLanguage();
            if (language == null || language.trim().isEmpty()) {
                language = "English";
            }
            
            String verificationCode = UUID.randomUUID().toString();
            LocalDateTime now = LocalDateTime.now();
            
            // Create User with role
            User user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setName(requestDTO.getName());
            user.setEmail(requestDTO.getEmail());
            user.setPhone(requestDTO.getPhone());
            user.setPassword(encodedPassword);
            user.setAddress(requestDTO.getAddress());
            user.setCity(requestDTO.getCity());
            user.setPincode(requestDTO.getPincode());
            user.setLanguage(language);
            user.setRole(role.toUpperCase());
            user.setActive(true);
            user.setVerified(false);
            user.setVerificationCode(verificationCode);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            
            User savedUser = userRepository.save(user);
            logger.info("✅ User saved to 'users' collection - ID: {}, Role: {}", savedUser.getId(), savedUser.getRole());
            
            // Send verification email
            try {
                emailVerificationService.sendVerificationEmail(savedUser);
            } catch (Exception e) {
                logger.error("❌ Failed to send verification email: {}", e.getMessage());
            }
            
            return savedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "registerUser", ex, requestDTO.getEmail());
            throw ex;
        }
    }
    
    /**
     * Login user - uses User collection with roles
     */
    public Map<String, Object> loginUser(LoginRequestDTO requestDTO) {
        LoggingUtil.logMethodEntry(logger, "loginUser", requestDTO.getEmail());
        
        try {
            String identifier = requestDTO.getEmail();
            String password = requestDTO.getPassword();
            
            logger.info("🔍 Login attempt - Email: {}, Password length: {}", 
                identifier, password != null ? password.length() : 0);
            
            // Find user by email or phone
            Optional<User> userOpt;
            if (identifier != null && identifier.contains("@")) {
                userOpt = userRepository.findByEmail(identifier);
            } else {
                userOpt = userRepository.findByPhone(identifier);
            }
            
            if (userOpt.isEmpty()) {
                logger.warn("❌ User not found for: {}", identifier);
                throw new RuntimeException("Invalid email or password");
            }
            
            User user = userOpt.get();
            String userPassword = user.getPassword();
            
            if (userPassword == null || userPassword.isEmpty()) {
                logger.warn("⚠️ User found but password not set for: {}", identifier);
                throw new RuntimeException("Password not set. Please set your password first.");
            }
            
            boolean passwordMatches = passwordEncoder.matches(password, userPassword);
            if (!passwordMatches) {
                logger.warn("⚠️ Password mismatch for user: {}", identifier);
                throw new RuntimeException("Invalid email or password");
            }
            
            if (!user.isActive()) {
                logger.warn("⚠️ Login attempt with deactivated account: {}", identifier);
                throw new RuntimeException("Account is deactivated");
            }
            
            if (!user.isVerified()) {
                logger.warn("⚠️ Login attempt with unverified email: {}", user.getEmail());
                throw new RuntimeException("Please verify your email before logging in");
            }
            
            // Update online status
            user.setOnline(true);
            user.setLastSeen(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            String token = "jwt-token-" + user.getId();
            String role = user.getRole() != null ? user.getRole() : "CUSTOMER";
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            response.put("role", role);
            response.put("userType", role);
            
            logger.info("✅ User logged in successfully - Email: {}, Role: {}", user.getEmail(), role);
            LoggingUtil.logMethodExit(logger, "loginUser", "User logged in successfully");
            return response;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "loginUser", ex, requestDTO.getEmail());
            throw ex;
        }
    }
    
    /**
     * Verify email - uses User collection
     */
    public boolean verifyEmail(String verificationCode) {
        LoggingUtil.logMethodEntry(logger, "verifyEmail", verificationCode);
        
        try {
            Optional<User> userOpt = userRepository.findByVerificationCode(verificationCode);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setVerified(true);
                user.setVerificationCode(null);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ User email verified - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("Invalid verification code");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyEmail", ex, verificationCode);
            throw ex;
        }
    }
    
    /**
     * Resend verification code - uses User collection
     */
    public boolean resendVerificationCode(String email) {
        LoggingUtil.logMethodEntry(logger, "resendVerificationCode", email);
        
        try {
            String newCode = UUID.randomUUID().toString();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setVerificationCode(newCode);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ Verification code resent to user - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("User not found");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "resendVerificationCode", ex, email);
            throw ex;
        }
    }
    
    /**
     * Forgot password - sends OTP to email
     */
    public Map<String, Object> forgotPassword(String email) {
        LoggingUtil.logMethodEntry(logger, "forgotPassword", email);
        
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found with this email");
            }
            
            // Send OTP via email (email is sent automatically)
            emailOTPService.sendOTP(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("message", "OTP sent to email");
            
            logger.info("✅ Password reset OTP sent to email: {}", email);
            
            return response;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "forgotPassword", ex, email);
            throw ex;
        }
    }
    
    /**
     * Verify OTP for password reset (doesn't remove OTP - keeps it for password reset step)
     */
    public boolean verifyPasswordResetOTP(String email, String otp) {
        LoggingUtil.logMethodEntry(logger, "verifyPasswordResetOTP", email);
        
        try {
            // Normalize email
            String normalizedEmail = email.toLowerCase().trim();
            
            // Verify OTP (but don't remove it - we need it for password reset)
            boolean otpValid = emailOTPService.verifyOTP(normalizedEmail, otp);
            if (!otpValid) {
                throw new RuntimeException("Invalid or expired OTP");
            }
            
            // Check if user exists
            Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            
            logger.info("✅ Password reset OTP verified for email: {}", normalizedEmail);
            return true;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyPasswordResetOTP", ex, email);
            throw ex;
        }
    }
    
    /**
     * Reset password with OTP verification - Simple: just update password in user collection
     */
    public boolean resetPasswordWithOTP(String email, String otp, String newPassword) {
        LoggingUtil.logMethodEntry(logger, "resetPasswordWithOTP", email);
        
        try {
            // Normalize email
            String normalizedEmail = email.toLowerCase().trim();
            String trimmedOtp = otp != null ? otp.trim() : "";
            
            // Check if OTP matches (without removing it - it was already verified in step 2)
            boolean otpValid = emailOTPService.checkOTPMatch(normalizedEmail, trimmedOtp);
            if (!otpValid) {
                logger.warn("❌ OTP validation failed for email: {}", normalizedEmail);
                throw new RuntimeException("Invalid or expired OTP. Please verify OTP again.");
            }
            
            // Find user by email
            Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found with email: " + normalizedEmail);
            }
            
            User user = userOpt.get();
            
            // Validate new password
            if (newPassword == null || newPassword.trim().isEmpty()) {
                throw new RuntimeException("Password cannot be empty");
            }
            if (newPassword.length() < 6) {
                throw new RuntimeException("Password must be at least 6 characters");
            }
            
            // Simply update password in user collection
            String encodedPassword = passwordEncoder.encode(newPassword.trim());
            user.setPassword(encodedPassword);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            // Remove OTP after successful password reset
            emailOTPService.removeOTP(normalizedEmail);
            
            LoggingUtil.logDatabaseOperation(logger, "RESET_PASSWORD", "users", user.getId(), "SUCCESS");
            logger.info("✅ Password reset successfully - User ID: {}, Email: {}", user.getId(), normalizedEmail);
            return true;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "resetPasswordWithOTP", ex, email);
            throw ex;
        }
    }
    
    /**
     * Reset password - uses token (legacy method for backward compatibility)
     */
    public boolean resetPassword(String token, String newPassword) {
        LoggingUtil.logMethodEntry(logger, "resetPassword", token);
        
        try {
            String encodedPassword = passwordEncoder.encode(newPassword);
            
            Optional<User> userOpt = userRepository.findByVerificationCode(token);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(encodedPassword);
                user.setVerificationCode(null);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ Password reset for user - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("Invalid reset token");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "resetPassword", ex, token);
            throw ex;
        }
    }
    
    /**
     * Logout user - Set offline status
     */
    public boolean logoutUser(String userId) {
        LoggingUtil.logMethodEntry(logger, "logoutUser", userId);
        
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setOnline(false);
                user.setLastSeen(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ User logged out - ID: {}", userId);
                return true;
            }
            
            throw new RuntimeException("User not found");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "logoutUser", ex, userId);
            throw ex;
        }
    }
}
