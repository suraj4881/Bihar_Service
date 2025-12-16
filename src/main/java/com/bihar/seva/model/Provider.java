package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Positive;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "providers")
@Data
public class Provider {
    @Id 
    private String id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @Email(message = "Invalid email format")
    @Indexed(unique = true)
    private String email;
    
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
    @Indexed(unique = true)
    private String phone;
    
    private String password;
    
    @NotBlank(message = "Skill is required")
    @TextIndexed
    private String skill;
    
    @NotBlank(message = "City is required")
    private String city;
    
    private String address;
    private String state = "Bihar";
    private String pincode;
    
    @Positive(message = "Price must be positive")
    private double price;
    
    private String description;
    private String profilePhoto;
    private List<String> servicePhotos;
    private List<String> certificates;
    private String experience;
    private String biography; // Provider bio/about
    private double hourlyRate; // Hourly rate for services
    private String workingHours;
    private List<String> serviceAreas;
    private Boolean isActive = true;
    private Boolean isVerified = false;
    private String kycStatus = "PENDING"; // PENDING, APPROVED, REJECTED
    private String verificationCode;
    private String language = "English"; // English, Hindi
    private boolean isOnline = false;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private double rating = 0.0;
    private int totalReviews = 0; // Total number of reviews
    private int totalBookings = 0;
    private int completedBookings = 0;
    private String bankAccount;
    private String ifscCode;
    private String upiId;
    
    private List<String> languages;
    
    private String emergencyContact;
    private String emergencyPhone;
    
    // Explicit getters/setters for boolean fields (Lombok issue with "is" prefix)
    public Boolean isVerified() {
        return this.isVerified;
    }
    
    public void setVerified(Boolean verified) {
        this.isVerified = verified;
    }
    
    public Boolean isActive() {
        return this.isActive;
    }
    
    public void setActive(Boolean active) {
        this.isActive = active;
    }
}