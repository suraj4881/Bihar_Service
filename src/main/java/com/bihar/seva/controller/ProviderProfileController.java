package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.ProviderProfile;
import com.bihar.seva.service.ProviderProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = "*")
public class ProviderProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProviderProfileController.class);
    
    @Autowired
    private ProviderProfileService providerProfileService;
    
    /**
     * Setup provider profile
     */
    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<ProviderProfile>> setupProfile(@RequestBody ProviderProfile profileData) {
        try {
            logger.info("Provider profile setup request received for userId: {}", profileData.getUserId());
            ProviderProfile savedProfile = providerProfileService.setupProfile(profileData);
            logger.info("Provider profile setup completed successfully for userId: {}", profileData.getUserId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile setup successful", savedProfile));
        } catch (Exception e) {
            logger.error("Provider profile setup failed for userId: {}", profileData.getUserId(), e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Profile setup failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get provider profile by user ID
     */
    @GetMapping("/profile/user/{userId}")
    public ResponseEntity<ApiResponse<ProviderProfile>> getProfileByUserId(@PathVariable String userId) {
        logger.info("Fetching provider profile for userId: {}", userId);
        Optional<ProviderProfile> profile = providerProfileService.getProfileByUserId(userId);
        
        if (profile.isPresent()) {
            logger.info("Provider profile found for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile found", profile.get()));
        } else {
            logger.warn("Provider profile not found for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(false, "Profile not found", null));
        }
    }
    
    /**
     * Get provider profile by provider ID
     */
    @GetMapping("/profile/{providerId}")
    public ResponseEntity<ApiResponse<ProviderProfile>> getProfileByProviderId(@PathVariable String providerId) {
        Optional<ProviderProfile> profile = providerProfileService.getProfileByProviderId(providerId);
        
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
        boolean isComplete = providerProfileService.isProfileComplete(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile completion status", isComplete));
    }
}

