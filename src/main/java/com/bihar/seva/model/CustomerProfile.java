package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "customer_profiles")
public class CustomerProfile {
    @Id
    private String id;
    private String userId;
    private String customerId; // Reference to Customer document
    
    // Address Information
    private Address address;
    
    // Preferences
    private Preferences preferences;
    
    // Status
    private Boolean isProfileComplete = false;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class Address {
        private String street;
        private String area;
        private String city;
        private String pincode;
        private String landmark;
    }
    
    @Data
    public static class Preferences {
        private String preferredLanguage; // "Hindi" or "English"
        private String communicationMode;  // "Phone", "Email", "SMS"
    }
}

