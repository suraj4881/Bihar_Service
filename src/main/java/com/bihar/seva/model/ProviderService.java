package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "provider_services")
public class ProviderService {
    @Id
    private String id;
    private String providerId;
    private String providerName;
    
    // Service Details
    private String title;
    private String description;
    private String category;
    private String expertiseLevel; // BEGINNER, INTERMEDIATE, EXPERT, MASTER
    private String estimatedDuration;
    private String serviceArea;
    private List<String> tags;
    
    // Pricing (Hidden from customers)
    private Double basePrice; // Provider's actual earnings
    private Double commissionRate = 20.0; // Default 20% commission
    private Double commissionAmount; // Calculated: basePrice * (commissionRate/100)
    private Double finalPrice; // Customer sees this: basePrice + commissionAmount
    
    // Images
    private List<String> serviceImages; // URLs of uploaded images
    
    // Status
    private Boolean isApproved = false; // Admin approval required
    private Boolean isActive = false;
    private String rejectionReason;
    
    // Admin Actions
    private String approvedBy; // Admin user ID
    private LocalDateTime approvedAt;
    
    // Ratings
    private Double averageRating = 0.0;
    private Integer totalReviews = 0;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Calculate final price with commission
     */
    public void calculateFinalPrice() {
        if (basePrice != null && commissionRate != null) {
            this.commissionAmount = basePrice * (commissionRate / 100);
            this.finalPrice = basePrice + commissionAmount;
        }
    }
}

