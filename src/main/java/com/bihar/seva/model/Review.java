package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDateTime;

@Document(collection = "reviews")
@Data
public class Review {
    @Id 
    private String id;
    
    @NotBlank(message = "Booking ID is required")
    @Indexed
    private String bookingId;
    
    @NotBlank(message = "Provider ID is required")
    @Indexed
    private String providerId;
    
    @NotBlank(message = "Customer ID is required")
    @Indexed
    private String customerId;
    
    private String customerName;
    private String customerPhoto;
    
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private int rating;
    
    private String comment;
    private String service;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Admin moderation
    private boolean isApproved = true;
    private boolean isReported = false;
    private String reportReason;
    private String moderatedBy;
    
    // Provider response
    private String providerResponse;
    private LocalDateTime respondedAt;
}

