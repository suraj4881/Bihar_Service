package com.bihar.seva.service;

import com.bihar.seva.model.Provider;
import com.bihar.seva.model.ProviderProfile;
import com.bihar.seva.repositories.ProviderProfileRepository;
import com.bihar.seva.repositories.ProviderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ProviderProfileService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProviderProfileService.class);
    
    @Autowired
    private ProviderProfileRepository providerProfileRepository;
    
    @Autowired
    private ProviderRepository providerRepository;
    
    /**
     * Create or update provider profile
     */
    public ProviderProfile setupProfile(ProviderProfile profileData) {
        logger.info("Setting up provider profile for userId: {}", profileData.getUserId());
        
        Optional<ProviderProfile> existingProfile = providerProfileRepository.findByUserId(profileData.getUserId());
        
        ProviderProfile profile;
        if (existingProfile.isPresent()) {
            logger.info("Updating existing profile for userId: {}", profileData.getUserId());
            profile = existingProfile.get();
        } else {
            logger.info("Creating new profile for userId: {}", profileData.getUserId());
            profile = new ProviderProfile();
            profile.setCreatedAt(LocalDateTime.now());
        }
        
        // Update fields
        profile.setUserId(profileData.getUserId());
        profile.setProviderId(profileData.getProviderId());
        profile.setServiceCategory(profileData.getServiceCategory());
        profile.setSkills(profileData.getSkills());
        profile.setExperience(profileData.getExperience());
        profile.setBiography(profileData.getBiography());
        profile.setHourlyRate(profileData.getHourlyRate());
        profile.setMinimumCharge(profileData.getMinimumCharge());
        profile.setServiceRadius(profileData.getServiceRadius());
        profile.setAvailability(profileData.getAvailability());
        profile.setWorkingHours(profileData.getWorkingHours());
        profile.setIsProfileComplete(true);
        profile.setUpdatedAt(LocalDateTime.now());
        
        // Save profile
        ProviderProfile savedProfile = providerProfileRepository.save(profile);
        logger.info("Provider profile saved successfully for userId: {}", profileData.getUserId());
        
        // Update Provider document with profile completion status
        updateProviderStatus(profileData.getProviderId(), savedProfile);
        
        return savedProfile;
    }
    
    /**
     * Update provider document when profile is complete
     */
    private void updateProviderStatus(String providerId, ProviderProfile profile) {
        if (providerId != null) {
            logger.info("Updating provider status for providerId: {}", providerId);
            Optional<Provider> providerOpt = providerRepository.findById(providerId);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setSkill(profile.getServiceCategory());
                provider.setExperience(profile.getExperience().toString() + " years");
                provider.setBiography(profile.getBiography());
                provider.setHourlyRate(profile.getHourlyRate());
                providerRepository.save(provider);
                logger.info("Provider document updated successfully for providerId: {}", providerId);
            } else {
                logger.warn("Provider not found for providerId: {}", providerId);
            }
        }
    }
    
    /**
     * Get provider profile by user ID
     */
    public Optional<ProviderProfile> getProfileByUserId(String userId) {
        return providerProfileRepository.findByUserId(userId);
    }
    
    /**
     * Get provider profile by provider ID
     */
    public Optional<ProviderProfile> getProfileByProviderId(String providerId) {
        return providerProfileRepository.findByProviderId(providerId);
    }
    
    /**
     * Check if profile is complete
     */
    public boolean isProfileComplete(String userId) {
        Optional<ProviderProfile> profile = providerProfileRepository.findByUserId(userId);
        return profile.isPresent() && profile.get().getIsProfileComplete();
    }
}

