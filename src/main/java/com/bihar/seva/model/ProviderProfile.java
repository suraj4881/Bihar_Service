package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "provider_profiles")
public class ProviderProfile {
    @Id
    private String id;
    private String userId;
    private String providerId; // Reference to Provider document
    
    // Service Details
    private String serviceCategory;
    private List<String> skills;
    private Integer experience; // Years of experience
    private String biography;
    
    // Pricing
    private Double hourlyRate;
    private Double minimumCharge;
    private Double serviceRadius; // in kilometers
    
    // Availability
    private Map<String, Boolean> availability; // day -> isAvailable
    private WorkingHours workingHours;
    
    // Status
    private Boolean isProfileComplete = false;
    private Boolean isApproved = false;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class WorkingHours {
        private String start; // e.g., "09:00"
        private String end;   // e.g., "18:00"
    }
}

