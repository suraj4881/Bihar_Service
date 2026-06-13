package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "users")
@Data
public class User {
    @Id 
    private String id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @Email(message = "Invalid email format")
    @Indexed(unique = true)
    private String email;
    
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
    @Indexed(unique = true, sparse = true) // sparse = true allows multiple null values
    private String phone;
    
    private String password;
    private String role = "CUSTOMER"; // CUSTOMER, PROVIDER, ADMIN
    private String language = "English"; // English, Hindi
    private String address;
    private String city;
    private String state = "Bihar";
    private String pincode;
    private String profilePhoto;
    
    // Location - GPS coordinates for location-based search
    private Double latitude;  // GPS latitude
    private Double longitude; // GPS longitude
    
    // ✅ Account Status
    private boolean isActive = true;        // Account enabled/disabled (can login or not)
    private boolean isVerified = false;     // Email verified or not
    
    // ✅ Online Status (NEW)
    private boolean isOnline = false;       // Currently logged in or not
    private LocalDateTime lastSeen;         // Last activity timestamp
    
    // Explicit getters with @JsonProperty to ensure correct JSON field names
    // Lombok generates isActive() but Jackson might serialize as "active", so we force "isActive"
    @com.fasterxml.jackson.annotation.JsonGetter("isActive")
    public boolean getIsActive() {
        return this.isActive;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("isVerified")
    public boolean getIsVerified() {
        return this.isVerified;
    }
    
    // Explicit boolean getter methods (Lombok should generate these, but adding explicitly for compatibility)
    public boolean isActive() {
        return this.isActive;
    }
    
    public boolean isVerified() {
        return this.isVerified;
    }
    
    private String verificationCode;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private List<String> favoriteProviders;
    private double rating = 0.0;
    private int totalBookings = 0;
    
    public enum Role {
        CUSTOMER, PROVIDER, ADMIN
    }
}
