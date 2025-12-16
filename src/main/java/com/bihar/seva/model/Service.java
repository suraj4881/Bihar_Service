package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.TextIndexed;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "services")
@Data
public class Service {
    @Id 
    private String id;
    
    @NotBlank(message = "Service name is required")
    @TextIndexed
    private String name;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    private String subcategory;
    private String description;
    private String icon;
    private String image;
    
    @Positive(message = "Base price must be positive")
    private double basePrice;
    
    private String priceUnit; // per hour, per service, per sq ft, etc.
    private String duration; // 1 hour, 2 hours, 1 day, etc.
    
    private List<String> tags;
    private List<String> requirements; // What customer needs to provide
    private List<String> benefits; // What customer gets
    
    private boolean isActive = true;
    private boolean isPopular = false;
    private boolean isCustom = false; // For manually added services
    
    private int sortOrder = 0;
    private int bookingCount = 0;
    private double averageRating = 0.0;
    
    private String createdBy; // User ID who created (for custom services)
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Service-specific fields
    private String toolsRequired;
    private String skillsRequired;
    private String experienceLevel; // Beginner, Intermediate, Expert
    private String workingHours;
    private String serviceAreas; // Areas where service is available
    
    // Pricing tiers
    private List<PriceTier> priceTiers;
    
    @Data
    public static class PriceTier {
        private String name; // Basic, Standard, Premium
        private double price;
        private String description;
        private List<String> includes;
    }
}
