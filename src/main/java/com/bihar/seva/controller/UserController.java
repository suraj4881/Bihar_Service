package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.ProfileUpdateDTO;
import com.bihar.seva.model.User;
import com.bihar.seva.service.UserService;
import com.bihar.seva.service.KYCService;
import com.bihar.seva.service.SMSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private KYCService kycService;
    
    @Autowired
    private SMSService smsService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable String id) {
        try {
            User user = userService.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }
            return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable String id, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "User updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @PathVariable String id, 
            @Valid @RequestBody ProfileUpdateDTO profileDTO) {
        try {
            User updatedUser = userService.updateProfile(id, profileDTO);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "Profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/kyc-status")
    public ResponseEntity<ApiResponse<Object>> getUserKYCStatus(@PathVariable String id) {
        try {
            Object kycStatus = kycService.getAggregatedKYCStatus(id);
            return ResponseEntity.ok(ApiResponse.success(kycStatus, "KYC status retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable String id,
            @RequestBody PasswordChangeRequest request) {
        try {
            boolean changed = userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
            if (changed) {
                return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Upload profile photo
     */
    @PostMapping("/{id}/upload-photo")
    public ResponseEntity<ApiResponse<User>> uploadPhoto(
            @PathVariable String id,
            @RequestParam("photo") MultipartFile photo) {
        try {
            User updatedUser = userService.uploadProfilePhoto(id, photo);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "Profile photo uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Send Aadhaar OTP for phone number change verification
     */
    @PostMapping("/{id}/verify-aadhaar-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendAadhaarOTP(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String aadhaarNumber = request.get("aadhaarNumber");
            if (aadhaarNumber == null || aadhaarNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Aadhaar number is required"));
            }
            boolean sent = userService.sendAadhaarOTP(id, aadhaarNumber.trim());
            Map<String, Object> response = new HashMap<>();
            response.put("otpSent", sent);
            return ResponseEntity.ok(ApiResponse.success(response, "OTP sent to registered mobile number"));
        } catch (Exception e) {
            logger.error("Error sending Aadhaar OTP for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Verify Aadhaar OTP
     */
    @PostMapping("/{id}/verify-aadhaar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyAadhaar(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String aadhaarNumber = request.get("aadhaarNumber");
            String otp = request.get("otp");
            boolean verified = userService.verifyAadhaarOTP(id, aadhaarNumber, otp);
            Map<String, Object> response = new HashMap<>();
            response.put("verified", verified);
            return ResponseEntity.ok(ApiResponse.success(response, verified ? "Aadhaar verified successfully" : "Invalid OTP"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Send OTP to old phone number for phone change verification
     */
    @PostMapping("/{id}/send-otp-old-phone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOTPToOldPhone(
            @PathVariable String id) {
        try {
            Map<String, Object> result = userService.sendOTPToOldPhone(id);
            return ResponseEntity.ok(ApiResponse.success(result, 
                "OTP sent to your registered phone number. Check backend logs or response for OTP (development mode)."));
        } catch (Exception e) {
            logger.error("Error sending OTP to old phone for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Verify old phone OTP
     */
    @PostMapping("/{id}/verify-old-phone-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOldPhoneOTP(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String otp = request.get("otp");
            boolean verified = userService.verifyOldPhoneOTP(id, otp);
            Map<String, Object> response = new HashMap<>();
            response.put("verified", verified);
            return ResponseEntity.ok(ApiResponse.success(
                response, 
                verified ? "Phone OTP verified successfully" : "Invalid OTP"
            ));
        } catch (Exception e) {
            logger.error("Error verifying old phone OTP for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Verify last transaction amount (when old phone unavailable)
     */
    @PostMapping("/{id}/verify-transaction-amount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyTransactionAmount(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            Double amount = null;
            Object amountObj = request.get("amount");
            if (amountObj instanceof Number) {
                amount = ((Number) amountObj).doubleValue();
            } else if (amountObj instanceof String) {
                amount = Double.parseDouble((String) amountObj);
            }
            
            if (amount == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Transaction amount is required"));
            }
            
            boolean verified = userService.verifyLastTransactionAmount(id, amount);
            Map<String, Object> response = new HashMap<>();
            response.put("verified", verified);
            return ResponseEntity.ok(ApiResponse.success(
                response, 
                verified ? "Transaction amount verified successfully" : "Invalid transaction amount"
            ));
        } catch (Exception e) {
            logger.error("Error verifying transaction amount for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get last transaction amount (for display/hint)
     */
    @GetMapping("/{id}/last-transaction-amount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLastTransactionAmount(
            @PathVariable String id) {
        try {
            Double amount = userService.getLastTransactionAmount(id);
            Map<String, Object> response = new HashMap<>();
            if (amount != null) {
                response.put("hasTransaction", true);
                response.put("amount", amount);
            } else {
                response.put("hasTransaction", false);
            }
            return ResponseEntity.ok(ApiResponse.success(response, "Transaction data retrieved"));
        } catch (Exception e) {
            logger.error("Error getting last transaction amount for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Send email OTP for phone change (after transaction verification)
     */
    @PostMapping("/{id}/send-email-otp-phone-change")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendEmailOTPForPhoneChange(
            @PathVariable String id) {
        try {
            Map<String, Object> result = userService.sendEmailOTPForPhoneChange(id);
            return ResponseEntity.ok(ApiResponse.success(result, 
                "OTP sent to your registered email address. Check backend logs or response for OTP (development mode)."));
        } catch (Exception e) {
            logger.error("Error sending email OTP for phone change for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Change phone number with email OTP verification
     */
    @PostMapping("/{id}/change-phone-email-otp")
    public ResponseEntity<ApiResponse<User>> changePhoneWithEmailOTP(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String newPhoneNumber = request.get("phoneNumber");
            String emailOTP = request.get("emailOTP");
            
            if (newPhoneNumber == null || emailOTP == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Phone number and email OTP are required"));
            }
            
            User updatedUser = userService.changePhoneWithEmailOTP(id, newPhoneNumber, emailOTP);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "Phone number updated successfully"));
        } catch (Exception e) {
            logger.error("Error changing phone with email OTP for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Send OTP to new phone number (Legacy - kept for backward compatibility)
     */
    @PostMapping("/{id}/send-phone-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendPhoneOTP(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            boolean sent = userService.sendPhoneOTP(id, phoneNumber);
            Map<String, Object> response = new HashMap<>();
            response.put("otpSent", sent);
            return ResponseEntity.ok(ApiResponse.success(response, "OTP sent to new phone number"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Change phone number after OTP verification (Legacy - kept for backward compatibility)
     */
    @PostMapping("/{id}/change-phone")
    public ResponseEntity<ApiResponse<User>> changePhoneNumber(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            String otp = request.get("otp");
            User updatedUser = userService.changePhoneNumber(id, phoneNumber, otp);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "Phone number updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Test SMS endpoint - Direct SMS testing
     */
    @PostMapping("/test-sms")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testSMS(
            @RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            String otp = request.getOrDefault("otp", "123456");
            String purpose = request.getOrDefault("purpose", "Test OTP");
            
            logger.info("🧪 Test SMS endpoint called");
            logger.info("🧪 Phone: {}", phoneNumber);
            logger.info("🧪 OTP: {}", otp);
            
            boolean sent = smsService.sendOTP(phoneNumber, otp, purpose);
            
            Map<String, Object> response = new HashMap<>();
            response.put("smsSent", sent);
            response.put("phoneNumber", phoneNumber);
            response.put("otp", otp);
            
            return ResponseEntity.ok(ApiResponse.success(
                response, 
                sent ? "SMS sent successfully. Check backend logs for details." : "SMS failed. Check backend logs for error."
            ));
        } catch (Exception e) {
            logger.error("❌ Error in test SMS endpoint: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // Inner class for password change request
    public static class PasswordChangeRequest {
        private String currentPassword;
        private String newPassword;
        
        public String getCurrentPassword() {
            return currentPassword;
        }
        
        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }
        
        public String getNewPassword() {
            return newPassword;
        }
        
        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
}
