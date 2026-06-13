package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.geo.Point;

import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Dynamic Service Model - Providers can create any service
 * Auto-categorization based on service name similarity
 */
@Data
@Document(collection = "services")
public class DynamicService {
    @Id
    private String id;
    
    @NotBlank(message = "Service name is required")
    @Indexed
    private String serviceName; // Free text - provider can enter anything
    
    @Indexed
    private String category; // Auto-generated or selected from existing
    
    private String categoryId; // Reference to Category collection if exists
    
    private String description;
    
    @NotBlank(message = "Provider ID is required")
    @Indexed
    private String providerId;
    
    private String providerName;
    
    // Location - GPS coordinates
    @Indexed
    private Point location; // MongoDB GeoJSON Point: [longitude, latitude]
    
    private String address;
    private String city;
    private String state = "Bihar";
    private String pincode;
    
    // Pricing (optional)
    private Double price; // Optional - can be "Contact for price"
    private String priceUnit; // "per hour", "per service", "per sq ft", "fixed", "contact"
    
    // Availability
    private List<String> availableDays; // ["Monday", "Tuesday", ...]
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private Boolean isAvailableNow = true;
    
    // Contact Methods
    private String phone;
    private String whatsappNumber;
    private Boolean allowDirectCall = true;
    private Boolean allowWhatsApp = true;
    private Boolean allowInAppChat = true;
    
    // Service Area
    private List<String> serviceAreas; // List of pincodes or areas
    private Integer serviceRadius; // in km (2, 5, 10)
    
    // Status
    private Boolean isActive = true;
    private Boolean isApproved = false; // Admin approval
    private String rejectionReason;
    private String approvedBy; // Admin ID
    private LocalDateTime approvedAt;
    
    // Trust System
    private Double averageRating = 0.0;
    private Integer totalReviews = 0;
    private Integer completedJobs = 0; // Work completed count
    private Boolean isVerified = false; // Provider verification badge
    
    // Commission System
    private Double commissionRate = 10.0; // 10% default
    private Double basePrice; // Provider's actual price
    private Double finalPrice; // Customer price (basePrice + commission)
    
    // Images
    private List<String> serviceImages;
    
    // Tags for better search
    private List<String> tags;
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * Calculate final price with commission
     */
    public void calculateFinalPrice() {
        if (basePrice != null && commissionRate != null) {
            this.finalPrice = basePrice + (basePrice * commissionRate / 100);
        } else if (price != null && commissionRate != null) {
            this.basePrice = price;
            this.finalPrice = price + (price * commissionRate / 100);
        }
    }
}
