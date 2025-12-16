package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Document(collection = "locations")
@Data
public class Location {
    @Id 
    private String id;
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @DecimalMin(value = "-90.0", message = "Invalid latitude")
    @DecimalMax(value = "90.0", message = "Invalid latitude")
    private double latitude;
    
    @DecimalMin(value = "-180.0", message = "Invalid longitude")
    @DecimalMax(value = "180.0", message = "Invalid longitude")
    private double longitude;
    
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String country = "India";
    private String landmark;
    private String locationType; // HOME, WORK, CURRENT, OTHER
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Location accuracy
    private double accuracy; // in meters
    private String source; // GPS, NETWORK, MANUAL
    
    // Additional location data
    private String district;
    private String block;
    private String village;
    private String locality;
}
