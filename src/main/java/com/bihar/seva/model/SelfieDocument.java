package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "selfie")
public class SelfieDocument {
    @Id
    private String id;
    private String userId;
    private String userRole; // "CUSTOMER" or "PROVIDER"
    
    // Selfie Image
    private String selfieImageUrl;
    
    // Capture Method
    private String captureMethod; // "UPLOAD" or "LIVE_CAPTURE"
    
    // Verification Status
    private VerificationStatus status = VerificationStatus.PENDING;
    private String rejectionReason;
    private String verifiedBy; // Admin user ID
    private LocalDateTime verifiedAt;
    
    // Timestamps
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
    
    public enum VerificationStatus {
        PENDING,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED
    }
}
