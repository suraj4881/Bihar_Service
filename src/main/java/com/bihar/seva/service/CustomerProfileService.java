package com.bihar.seva.service;

import com.bihar.seva.model.CustomerProfile;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.CustomerProfileRepository;
import com.bihar.seva.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CustomerProfileService {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomerProfileService.class);
    
    @Autowired
    private CustomerProfileRepository customerProfileRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Create or update customer profile
     */
    public CustomerProfile setupProfile(CustomerProfile profileData) {
        logger.info("Setting up customer profile for userId: {}", profileData.getUserId());
        
        Optional<CustomerProfile> existingProfile = customerProfileRepository.findByUserId(profileData.getUserId());
        
        CustomerProfile profile;
        if (existingProfile.isPresent()) {
            logger.info("Updating existing profile for userId: {}", profileData.getUserId());
            profile = existingProfile.get();
        } else {
            logger.info("Creating new profile for userId: {}", profileData.getUserId());
            profile = new CustomerProfile();
            profile.setCreatedAt(LocalDateTime.now());
        }
        
        // Update fields
        profile.setUserId(profileData.getUserId());
        profile.setCustomerId(profileData.getCustomerId());
        profile.setAddress(profileData.getAddress());
        profile.setPreferences(profileData.getPreferences());
        profile.setIsProfileComplete(true);
        profile.setUpdatedAt(LocalDateTime.now());
        
        CustomerProfile savedProfile = customerProfileRepository.save(profile);
        logger.info("Customer profile saved successfully for userId: {}", profileData.getUserId());
        
        return savedProfile;
    }
    
    /**
     * Setup profile with password (for OTP login users)
     */
    public CustomerProfile setupProfileWithPassword(CustomerProfile profileData, String password) {
        logger.info("Setting up customer profile with password for userId: {}", profileData.getUserId());
        
        // Save profile first
        CustomerProfile savedProfile = setupProfile(profileData);
        
        // Update user password if provided
        if (password != null && !password.isEmpty()) {
            Optional<User> userOpt = userRepository.findById(profileData.getUserId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
                logger.info("✅ Password created for OTP login user: {}", profileData.getUserId());
            }
        }
        
        return savedProfile;
    }
    
    /**
     * Get customer profile by user ID
     */
    public Optional<CustomerProfile> getProfileByUserId(String userId) {
        return customerProfileRepository.findByUserId(userId);
    }
    
    /**
     * Get customer profile by customer ID
     */
    public Optional<CustomerProfile> getProfileByCustomerId(String customerId) {
        return customerProfileRepository.findByCustomerId(customerId);
    }
    
    /**
     * Check if profile is complete
     */
    public boolean isProfileComplete(String userId) {
        Optional<CustomerProfile> profile = customerProfileRepository.findByUserId(userId);
        return profile.isPresent() && profile.get().getIsProfileComplete();
    }
}

