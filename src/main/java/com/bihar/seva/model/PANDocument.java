package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "pan")
public class PANDocument {
    @Id
    private String id;
    private String userId;
    private String userRole; // "CUSTOMER" or "PROVIDER"
    
    // PAN Card Image
    private String panImageUrl;
    
    // PAN Number
    private String panNumber;
    
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
