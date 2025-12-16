package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.ProfileSetupRequest;
import com.bihar.seva.model.CustomerProfile;
import com.bihar.seva.service.CustomerProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomerProfileController.class);
    
    @Autowired
    private CustomerProfileService customerProfileService;
    
    /**
     * Setup customer profile (with optional password for OTP users)
     */
    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<CustomerProfile>> setupProfile(@RequestBody ProfileSetupRequest request) {
        try {
            logger.info("Customer profile setup request received for userId: {}", request.getUserId());
            
            // Create CustomerProfile object
            CustomerProfile profileData = new CustomerProfile();
            profileData.setUserId(request.getUserId());
            profileData.setCustomerId(request.getCustomerId());
            profileData.setAddress(request.getAddress());
            profileData.setPreferences(request.getPreferences());
            
            CustomerProfile savedProfile;
            
            // If password provided (OTP login user), use setupProfileWithPassword
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                logger.info("Password provided - OTP login user creating password");
                savedProfile = customerProfileService.setupProfileWithPassword(profileData, request.getPassword());
            } else {
                savedProfile = customerProfileService.setupProfile(profileData);
            }
            
            logger.info("Customer profile setup completed successfully for userId: {}", request.getUserId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile setup successful", savedProfile));
        } catch (Exception e) {
            logger.error("Customer profile setup failed for userId: {}", request.getUserId(), e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Profile setup failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get customer profile by user ID
     */
    @GetMapping("/profile/user/{userId}")
    public ResponseEntity<ApiResponse<CustomerProfile>> getProfileByUserId(@PathVariable String userId) {
        logger.info("Fetching customer profile for userId: {}", userId);
        Optional<CustomerProfile> profile = customerProfileService.getProfileByUserId(userId);
        
        if (profile.isPresent()) {
            logger.info("Customer profile found for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile found", profile.get()));
        } else {
            logger.warn("Customer profile not found for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(false, "Profile not found", null));
        }
    }
    
    /**
     * Get customer profile by customer ID
     */
    @GetMapping("/profile/{customerId}")
    public ResponseEntity<ApiResponse<CustomerProfile>> getProfileByCustomerId(@PathVariable String customerId) {
        Optional<CustomerProfile> profile = customerProfileService.getProfileByCustomerId(customerId);
        
        if (profile.isPresent()) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile found", profile.get()));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(false, "Profile not found", null));
        }
    }
    
    /**
     * Check if profile is complete
     */
    @GetMapping("/profile/complete/{userId}")
    public ResponseEntity<ApiResponse<Boolean>> isProfileComplete(@PathVariable String userId) {
        boolean isComplete = customerProfileService.isProfileComplete(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile completion status", isComplete));
    }
}

