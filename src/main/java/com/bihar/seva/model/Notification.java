package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
public class Notification {
    @Id 
    private String id;
    
    @NotBlank(message = "User ID is required")
    @Indexed
    private String userId;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String type; // BOOKING, PAYMENT, KYC, REVIEW, PROMOTION, SYSTEM
    private String referenceId; // ID of related booking/KYC/etc
    private String icon;
    private String actionUrl;
    
    private boolean isRead = false;
    private LocalDateTime readAt;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    
    // Priority
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT
}

